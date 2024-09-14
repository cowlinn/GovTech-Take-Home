import React, { useState, useEffect } from 'react';
import api from '../services/api'; // Adjust the path if necessary
import '../App.css'

function EnterTournament() {
//   const [teams, setTeams] = useState([]);
//   const [message, setMessage] = useState('');
  const [matchResults, setMatchResults] = useState('');
  const [rankedTeams, setRankedTeams] = useState([]);

  useEffect(() => {
    // Fetch teams and display them
    const fetchTeamRanks = async () => {
      const response = await api.get('/teams/ranked'); 
      const curr_ranked = response.data
      console.log(curr_ranked)
      setRankedTeams(curr_ranked);
    };
    fetchTeamRanks();
  }, []);

  const handleSubmitResults = async () => {
    const lines = matchResults.split('\n').filter(line => line.trim() !== '');
    const results = lines.map(line => {
      const [teamA, teamB, teamAGoals, teamBGoals] = line.trim().split(/\s+/);
      return { teamA, teamB, teamAGoals: parseInt(teamAGoals, 10), teamBGoals: parseInt(teamBGoals, 10) };
    });
  
    try {
      //console.log(results);
      const response = await api.post('/matches', results); // Post the results to the backend
      const ranked = response.data
      setRankedTeams(ranked);
    } catch (error) {
        //TODO: log this on the frontend
      console.error('Failed to submit match results', error.status, error.response.data);
    }
  };

  return (
    <div>
      <h1>Match Results</h1>
      <textarea
        rows="10"
        cols="50"
        value={matchResults}
        onChange={(e) => setMatchResults(e.target.value)}
      />
      <br />
      <button onClick={handleSubmitResults}>Submit Results</button>

      <h2>Promoted Teams</h2>
      <table>
        <thead>
          <tr>
            <th>Team </th>
            <th>Group </th>
            <th>Points</th>
            <th>Goals</th>
            <th>Alternative_Points</th>
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
    </div>
  );
}

export default EnterTournament;
