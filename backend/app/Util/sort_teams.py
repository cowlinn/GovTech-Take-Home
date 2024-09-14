from typing import List
from app.models import Team


def rank_teams(team_collection) -> List[Team]:
    """
    Utility function to rank the current teams in 
    """
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
