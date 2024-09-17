from datetime import datetime
import os
from fastapi import APIRouter, HTTPException
from pymongo import MongoClient
from app.models import Team, MatchResult, ResponseMessage
from typing import Dict, List
from bson import ObjectId

from app.Util.score_helper import add_score, undo_score
from app.Util.sort_teams import rank_teams

router = APIRouter()
import logging
logger = logging.getLogger(__name__)


EXPECTED_MATCHES_TOTAL = 30


mongo_connection = os.getenv("MONGO_CONNECTION_STRING", default='mongodb://localhost:27017/')
client = MongoClient(mongo_connection)


db = client["team_database"]
team_collection = db["teams"] #Team results
match_collection = db["matches"] #Match Results

@router.get("/health/db")
async def check_db_health():
    try:
        # Perform a ping to the database to check the connection
        client.admin.command('ping')
        return {"status": "Database connection is healthy"}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Database connection failed")


@router.get("/findTeam/{team_name}")
async def find_team(team_name:str):
    try:
        curr_team = team_collection.find_one(
            {"name" : team_name}
        )
        if not curr_team:
            raise HTTPException(status_code=404, detail=f"{team_name} not found")
        
        curr_team["_id"] = str(curr_team["_id"])
        return curr_team
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.post("/teams/")
async def add_teams(teams: List[Team]):
    logger.info(f"Method: attempting to insert the following teams: ${teams}")
    groups = dict()
    names = set()
    for team in teams:
        if team.name in names:
            raise HTTPException(status_code=500, detail="repeated team name")
        if team.group_number not in groups:
            groups[team.group_number] = []
        groups[team.group_number].append(team.name)
    
    group_count = 0
    for group in groups:
        group_count += 1
        if len(groups[group]) != 6:
            raise HTTPException(status_code=500, detail="invalid group size")
    
    if group_count != 2:
        raise HTTPException(status_code=500, detail="invalid number of groups")

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
    items = rank_teams(team_collection=team_collection)
    for item in items:
        item["_id"] = str(item["_id"])

    return items

@router.put("/teams/{team_id}")
async def update_team(team_id: str, team: Team):
    logger.info(f"Updating team with previous id = ${team_id}, new team = ${team}")
    try:
        name_clash = team_collection.find_one(
            {"name" : team.name}
        )
        if name_clash and str(name_clash["_id"]) != team_id:
            raise HTTPException(status_code=422, detail=f"{team}: team name already exists!")
        result = team_collection.update_one(
            {"_id": ObjectId(team_id)},
            {"$set": team.dict(by_alias=True)}
        )
      
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


@router.post("/matches/update/", response_model=List[Team])
async def record_matches_update(results: List[MatchResult]):
     """
     Add all new records into the table
     """
     await delete_all_matches()
     for result in results:
            add_score(result=result, team_collection=team_collection, match_collection=match_collection)

     return rank_teams(team_collection=team_collection)

## I really dislike this implementation. Class behavior should be abstracted in the Team class.
## In any case, this is a potential improvement
@router.post("/matches/", response_model=List[Team])
async def record_matches(results: List[MatchResult]):
    logger.info(f"Attempting to insert the following match results: ${results}")
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

        return rank_teams(team_collection=team_collection)
    
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    



