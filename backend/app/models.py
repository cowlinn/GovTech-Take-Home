from pydantic import BaseModel, Field
from datetime import datetime

class Team(BaseModel):
    name: str
    registration_date: str = Field(..., alias='registrationDate')  # Keep as string, parse later
    group_number: int = Field(..., alias='groupNumber')

    def parse_registration_date(self):
        # Parse DD/MM format to a date object
        self.registration_date = datetime.strptime(self.registration_date, "%d/%m").date()

