from datetime import datetime
from fastapi import APIRouter, HTTPException
from pymongo import MongoClient
from app.models import Team, MatchResult, ResponseMessage
from typing import Dict, List
from bson import ObjectId

from app.Util.score_helper import add_score, undo_score

router = APIRouter()


EXPECTED_MATCHES_TOTAL = 30

#client = MongoClient('mongodb://db:27017/') -> prod URL 
client = MongoClient('mongodb://localhost:27017/')


db = client["team_database"]
team_collection = db["teams"]
match_collection = db["matches"] #Full of Match Result

@router.get("/health/db")
async def check_db_health():
    try:
        # Perform a ping to the database to check the connection
        client.admin.command('ping')
        return {"status": "Database connection is healthy"}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
@router.post("/teams/")
async def add_teams(teams: List[Team]):
    #print(teams)
    try:
        team_collection.insert_many([team.dict(by_alias=True) for team in teams])
        return {"message": "Teams added successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/teams/")
async def get_teams():
    teams = list(team_collection.find())
    
    for team in teams:
        team["_id"] = str(team["_id"])
    
    return teams

@router.get("/matches/")
async def get_matches():
    matches = list(match_collection.find())
    for m in matches:
        m["_id"] = str(m["_id"])
    return matches

@router.get("/teams/ranked")
async def get_ranked_teams():
    items = rank_teams()
    for item in items:
        item["_id"] = str(item["_id"])

    return items

@router.put("/teams/{team_id}")
async def update_team(team_id: str, team: Team):
    try:
        result = team_collection.update_one(
            {"_id": ObjectId(team_id)},
            {"$set": team.dict(by_alias=True)}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Team not found or no changes made")
        return {"message": "Team updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/teams/")
async def delete_all_teams():
    try:
        team_collection.delete_many({})  # Delete all documents in the collection
        match_collection.delete_many({})
        return {"message": "All teams have been cleared."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@router.delete("/matches/")
async def delete_all_matches():
    try:
        matches = list(match_collection.find())
        for match in matches:
            #print(match)
            undo_score(result=match, team_collection=team_collection, match_collection=match_collection)
        #team_collection.delete_many({})  # Delete all documents in the collection
        match_collection.delete_many({})
        return {"message": "All matches have been cleared."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/matches/update", response_model=List[Team])
async def record_matches_update(results: List[MatchResult]):
     """
     Quite a hackish solution, just delete all previous matches and add the current ones back
     """
     await delete_all_matches()
     for result in results:
            add_score(result=result, team_collection=team_collection, match_collection=match_collection)

     return rank_teams()

## I really dislike this implementation. Class behavior should be abstracted in the Team class.
## In any case, this is a potential improvement
@router.post("/matches/", response_model=List[Team])
async def record_matches(results: List[MatchResult]):
    if len(results) != EXPECTED_MATCHES_TOTAL:
        raise HTTPException(status_code=422, detail=f"Need exactly {EXPECTED_MATCHES_TOTAL} matches for input")
    try:
        #first pass does a check for valid matches (that hasn't been played)
        match_check = dict()

        for result in results:
            team_a_name = result.teamA
            team_b_name = result.teamB

            if team_a_name not in match_check:
                match_check[team_a_name] = []
            
            if team_b_name not in match_check:
                match_check[team_b_name] = []

            # Retrieve the teams
            team_a = team_collection.find_one({"name": team_a_name})
            team_b = team_collection.find_one({"name": team_b_name})

            if not team_a or not team_b:
                raise HTTPException(status_code=404, detail="One or both teams not found")

            
            if team_b_name in match_check[team_a_name] or team_a_name in match_check[team_b_name]:
                raise HTTPException(status_code=422, detail=f"{result}: Match has already been played")
            
            if team_a["groupNumber"] != team_b["groupNumber"]:
                raise HTTPException(status_code=422, detail=f"{result}: Both teams aren't in the same group")
            
            match_check[team_a_name].append(team_b_name)
            match_check[team_b_name].append(team_a_name)
    
        #second pass does the update
        for result in results:
            add_score(result=result, team_collection=team_collection, match_collection=match_collection)

        return rank_teams()
    
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    


def rank_teams() -> List[Team]:
    # Retrieve all teams from MongoDB
    teams = list(team_collection.find())
    
    grouped_teams = {}
    for team in teams:
        group_number = team['groupNumber']
        if group_number not in grouped_teams:
            grouped_teams[group_number] = []
        grouped_teams[group_number].append(team)
    
    # Sort by criteria 
    def sort_teams(teams_list):
        return sorted(
            teams_list,
            key=lambda t: (
                t['points'],  # Highest total match points
                t['goals_scored'],  # Highest total goals scored
                t['alternate_points'],  # Highest alternate match points
                t['registrationDate']  # Earliest registration date
            ),
            reverse=True
        )
    # Rank teams within each group
    ranked_teams = []
    for group_number, teams_list in grouped_teams.items():
        #print(len(teams_list))
        sorted_teams = sort_teams(teams_list)
        top_teams = sorted_teams[:4]  # Select top 4 teams
        #print(len(top_teams))
        ranked_teams.extend(top_teams)
    
    #print(len(ranked_teams))
    return ranked_teams




