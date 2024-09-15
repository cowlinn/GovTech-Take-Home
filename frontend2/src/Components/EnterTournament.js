import React, { useState, useEffect } from 'react';
import api from '../services/api'; // Adjust the path if necessary
import '../App.css';
import TeamInfo from '../Components/TeamInfo';
import Constants from '../Utilities/Constants';
const {EXPECTED_MATCHES_TOTAL} = Constants

function EnterTournament() {
  const [matchResults, setMatchResults] = useState('');
  const [rankedTeams, setRankedTeams] = useState([]);
  const [matches, setMatches] = useState([]); // State to store matches
  const [editMode, setEditMode] = useState(localStorage.getItem('editResults') === 'true');
  const [editMessage, setEditMessage] = useState('');
  const [inputMessage, setInputMessage] = useState('');
 

  useEffect(() => {
    // Fetch ranked teams when the component mounts
    const fetchTeamRanks = async () => {
      const response = await api.get('/teams/ranked'); 
      const curr_ranked = response.data;
      //console.log(curr_ranked);
      setRankedTeams(curr_ranked);
    };
    fetchTeamRanks();

    // Fetch current matches if in edit mode
    if (editMode) {
      fetchMatches();
    }
  }, [editMode]);

  const fetchMatches = async () => {
    try {
      const response = await api.get('/matches');
      const currentMatches = response.data;
      setMatches(currentMatches);
    } catch (error) {
      console.error('Failed to fetch matches', error.status, error.response.data);
    }
  };

  const handleSubmitResults = async () => {
    const lines = matchResults.split('\n').filter(line => line.trim() !== '');
    let valid_lines = true;
    let error_line = "";
    let error_message = "";
    const results = [];
  
    for (const line of lines) {
      try {
        const [teamA, teamB, teamAGoals, teamBGoals] = line.trim().split(/\s+/);
        
        // Check each individual match format 
        if (!teamA || !teamB || isNaN(teamAGoals) || isNaN(teamBGoals)) {
          throw new Error('Invalid input format');
        }
        results.push({ 
          teamA, 
          teamB, 
          teamAGoals: parseInt(teamAGoals, 10), 
          teamBGoals: parseInt(teamBGoals, 10) 
        });

        if (teamAGoals <0 || teamBGoals < 0) {
          throw new Error('No negative goals');
        }
      } catch (error) {
        error_message = error;
        valid_lines = false;
        error_line = line.toString();
        break;  
      }
    }
  
    // If there was invalid input, display an error message and stop processing
    if (!valid_lines) {
      setInputMessage(`Invalid input format for line: ${error_line}. ${error_message}`);
      return;
    }
  
    // Check if the number of matches is exactly what is expected
    if (lines.length !== EXPECTED_MATCHES_TOTAL) {
      setInputMessage(`Error: Please enter exactly ${EXPECTED_MATCHES_TOTAL} matches.`);
      return;
    }
  
    try {
      // Submit match results to backend
      const response = await api.post('/matches', results); 
      const ranked = response.data;
      setRankedTeams(ranked);
  
      // Store the flag in localStorage and switch to edit mode
      localStorage.setItem('editResults', 'true');
      setEditMode(true);
    } catch (error) {
      setInputMessage(`Failed to submit match results. One or more teams do not exist`);
    }
  };

  const handleEditMatch = (index, field, value) => {
    const updatedMatches = [...matches];
    updatedMatches[index] = { ...updatedMatches[index], [field]: value };

    setMatches(updatedMatches);
  };

  const handleSaveMatches = async () => {
    try {
      // Send the updated matches to the backend
      const rank = await api.post('/matches/update/', matches);
      const rank_response = rank.data;
      setRankedTeams(rank_response);
      setEditMessage('Matches saved successfully');
    } catch (error) {
      setEditMessage(`Failed to save matches,${error.response.data}`);
    }
  };

  const handleClearAllMatches = async () => {
    try {
      // Call backend to delete all matches
      await api.delete('/matches/');
      
      // Clear matches in the frontend
      setMatches([]);
      
      // Remove edit mode and the localStorage flag
      setEditMode(false);
      localStorage.removeItem('editResults');

      setInputMessage('All matches cleared successfully');
    } catch (error) {
      setInputMessage(`Failed to clear matches : ${error.response.data}`);
    }
  };
  

   return (
    <div>
      <h1>Match Results</h1>
      {editMode ? (
        <>
          {/* Match editing table */}
          <table>
            <thead>
              <tr>
                <th>Home</th>
                <th>Away</th>
                <th>Home Goals</th>
                <th>Away Goals</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((match, index) => (
                <tr key={index}>
                  <td>{match.teamA}</td>
                  <td>{match.teamB}</td>
                  <td>
                    <input
                      type="number"
                      value={match.teamAGoals}
                      onChange={(e) => handleEditMatch(index, 'teamAGoals', parseInt(e.target.value))}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={match.teamBGoals}
                      onChange={(e) => handleEditMatch(index, 'teamBGoals', parseInt(e.target.value))}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={handleSaveMatches}>Save Edited Matches</button>
          <button onClick={handleClearAllMatches} className="clear-all-button"> Clear all matches </button>
          {editMessage && <p>{editMessage}</p>}
        </>
      ) : (
        <>
          <textarea
            rows="10"
            cols="50"
            value={matchResults}
            onChange={(e) => setMatchResults(e.target.value)}
          />
          <br />
          <button onClick={handleSubmitResults}>Submit Results</button>
          {inputMessage && <p>{inputMessage}</p>}
        </>
      )}

      <h2>Promoted Teams</h2>
      <table>
        <thead>
          <tr>
            <th>Team</th>
            <th>Group</th>
            <th>Points</th>
            <th>Goals</th>
            <th>Alternate Points</th>
          </tr>
        </thead>
        <tbody>
          {rankedTeams.map(team => (
            <tr key={team.name}>
              <td>{team.name}</td>
              <td>{team.groupNumber}</td>
              <td>{team.points}</td>
              <td>{team.goals_scored}</td>
              <td>{team.alternate_points}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <TeamInfo />
    </div>
  );
}

export default EnterTournament;
