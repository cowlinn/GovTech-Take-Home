from fastapi import APIRouter, HTTPException
from pymongo import MongoClient
from app.models import Team
from typing import List

router = APIRouter()

#client = MongoClient('mongodb://db:27017/') -> prod URL 

client = MongoClient('mongodb://localhost:27017/')
db = client["team_database"]
team_collection = db["teams"]


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
    print(teams)
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
