from fastapi import HTTPException
from app.models import Team, MatchResult

def add_score(result:MatchResult, team_collection, match_collection):
    """
    helps to add the score to the given team/match collection (these are PyMongo Objects)
    """

    team_a_name = result.teamA
    team_b_name = result.teamB
    team_a_goals = result.teamAGoals or 0
    team_b_goals = result.teamBGoals or 0

    ##Actual mongo dictionaries
    team_a = team_collection.find_one({"name": team_a_name})
    team_b = team_collection.find_one({"name": team_b_name})

    # Update team A
    team_a_updates = {}
   
    team_a_updates["matches_played"] = team_a["matches_played"] + 1
    team_a_updates["alternate_points"] = team_a['alternate_points']
    team_a_updates["points"] = team_a["points"]
    team_a_updates["goals_scored"] = team_a["goals_scored"] + team_a_goals

    #win
    if team_a_goals > team_b_goals:
        team_a_updates['points'] += 3
        team_a_updates['alternate_points'] += 5
    #loss
    elif team_a_goals < team_b_goals: 
        team_a_updates['alternate_points'] += 1

    else:  # Draw
        team_a_updates['points'] += 1
        team_a_updates['alternate_points'] += 3


    # Update team B
    team_b_updates = {}
    
    team_b_updates['matches_played'] = team_b["matches_played"] + 1
    team_b_updates["alternate_points"] = team_b['alternate_points']
    team_b_updates["points"] = team_b["points"]
    team_b_updates["goals_scored"] = team_b["goals_scored"] + team_b_goals

    if team_b_goals > team_a_goals:
        team_b_updates['points'] += 3
        team_b_updates['alternate_points'] += 5
    elif team_b_goals < team_a_goals:
        team_b_updates['alternate_points'] += 1
    else:  # Draw
        team_b_updates['points'] += 1
        team_b_updates['alternate_points'] += 3

    #save to backend
    try:
        # Save updated teams
        team_collection.update_one({"name": team_a_name}, {"$set": team_a_updates})
        team_collection.update_one({"name": team_b_name}, {"$set": team_b_updates})
        match_collection.insert_one(result.dict(by_alias=True))
    except Exception as e:
        #print(e)
        raise HTTPException(status_code=500, detail=str(e))
    

def undo_score(result:dict, team_collection, match_collection):
    """
    Does the opposite of add_score. Takes in a record and "undoes" it's effect
    """
   
    team_a_name = result["teamA"]
    team_b_name = result["teamB"]
    team_a_goals = result["teamAGoals"] or 0
    team_b_goals = result["teamBGoals"] or 0 

    ##Actual mongo dictionaries
    team_a = team_collection.find_one({"name": team_a_name})
    team_b = team_collection.find_one({"name": team_b_name})

    # Update team A
    team_a_updates = {}
    
    team_a_updates["matches_played"] = team_a["matches_played"] - 1
    team_a_updates["alternate_points"] = team_a['alternate_points']
    team_a_updates["points"] = team_a["points"]
    team_a_updates["goals_scored"] = team_a["goals_scored"] - team_a_goals

    #win
    if team_a_goals > team_b_goals:
        team_a_updates['points']-= 3
        team_a_updates['alternate_points'] -= 5
    #loss
    elif team_a_goals < team_b_goals: 
        team_a_updates['alternate_points'] -= 1

    else:  # Draw
        team_a_updates['points'] -= 1
        team_a_updates['alternate_points'] -= 3


    # Update team B
    team_b_updates = {}
 
    team_b_updates['matches_played'] = team_b["matches_played"] - 1
    team_b_updates["alternate_points"] = team_b['alternate_points']
    team_b_updates["points"] = team_b["points"]
    team_b_updates["goals_scored"] = team_b["goals_scored"] - team_b_goals

    if team_b_goals > team_a_goals:
        team_b_updates['points'] -= 3
        team_b_updates['alternate_points'] -= 5
    elif team_b_goals < team_a_goals:
        team_b_updates['alternate_points'] -= 1
    else:  # Draw
        team_b_updates['points'] -= 1
        team_b_updates['alternate_points'] -= 3

    #save to backend
    try:
        # Save updated teams
        team_collection.update_one({"name": team_a_name}, {"$set": team_a_updates})
        team_collection.update_one({"name": team_b_name}, {"$set": team_b_updates})
        match_collection.delete_one(result)
    except Exception as e:
        #print(e)
        raise HTTPException(status_code=500, detail=str(e))