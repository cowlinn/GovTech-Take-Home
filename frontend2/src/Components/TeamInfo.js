import React, { useState } from 'react';
import api from '../services/api'; // Adjust the path if needed


const TeamInfo = () => {
  const [teamName, setTeamName] = useState('');
  const [teamData, setTeamData] = useState(null);
  const [message, setMessage] = useState('');

  const handleSearch = async () => {
    if (!teamName.trim()) {
      setMessage('Please enter a team name');
      return;
    }

    try {
      const response = await api.get(`/findTeam/${teamName}`);
      setTeamData(response.data);
      setMessage('');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setMessage(`Team "${teamName}" not found`);
      } else {
        setMessage('Failed to fetch team data');
      }
      setTeamData(null);
    }
  };

  return (
    <div className="team-info-container">
      <h2>Search for a Team</h2>
      <input
        type="text"
        value={teamName}
        onChange={(e) => setTeamName(e.target.value)}
        placeholder="Enter team name"
      />
      <button onClick={handleSearch}>Search</button>
      {message && <p className="error-message">{message}</p>}

      {teamData && (
        <div className="team-details">
          <h3>Team Information</h3>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Group Number</th>
                <th>Points</th>
                <th>Goals Scored</th>
                <th>Alternate Points</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{teamData.name}</td>
                <td>{teamData.groupNumber}</td>
                <td>{teamData.points}</td>
                <td>{teamData.goals_scored}</td>
                <td>{teamData.alternate_points}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TeamInfo;
