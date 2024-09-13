import React, { useState, useEffect } from 'react';
import api from '../services/api'; // Adjust the path as necessary

function EnterTournament() {
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await api.get('/teams/');
        setTeams(response.data);
      } catch (error) {
        console.error('Failed to fetch teams', error);
      }
    };

    fetchTeams();
  }, []);

  return (
    <div>
      <h2>Teams Table</h2>
      <table>
        <thead>
          <tr>
            <th>Team Name</th>
            <th>Group Number</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((team, index) => (
            <tr key={index}>
              <td>{team.name}</td>
              <td>{team.groupNumber}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default EnterTournament;
