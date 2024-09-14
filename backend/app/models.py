from pydantic import BaseModel, Field
from datetime import datetime
from typing import List


#this should be a folder of models
#but I got a bit lazy to change this 

class Team(BaseModel):
    """
    Base construct of a football team
    """
    name: str
    registration_date: str = Field(..., alias='registrationDate')  # Keep as string, parse later
    group_number: int = Field(..., alias='groupNumber')
    points: int = Field(default=0)
    alternate_points: int = Field(default=0)
    matches_played: int = Field(default=0)
    goals_scored: int = Field(default=0)
    opponents: List[str] = Field(default=[])  # List of opponent team names

    def parse_registration_date(self):
        # Parse DD/MM format to a date object
        self.registration_date = datetime.strptime(self.registration_date, "%d/%m").date()

class MatchResult(BaseModel):
    teamA: str
    teamB: str
    teamAGoals: int
    teamBGoals: int

class ResponseMessage(BaseModel):
    message: str