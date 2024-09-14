import React, { useState, useEffect } from 'react';
import api from '../services/api'; // Assuming you have axios or some HTTP service setup

const TeamList = () => {
  const [teams, setTeams] = useState([]);
  const [editMode, setEditMode] = useState({}); // Tracks which rows are in edit mode

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await api.get('/teams/');
      // Sort by group number, then by registration date (earliest first)
      const sortedTeams = response.data.sort((a, b) => {
        if (a.groupNumber === b.groupNumber) {
          return new Date(a.registrationDate) - new Date(b.registrationDate);
        }
        return a.groupNumber - b.groupNumber;
      });
      setTeams(sortedTeams);
    } catch (error) {
      console.error('Failed to fetch teams', error);
    }
  };

  const handleEditClick = (teamId) => {
    setEditMode((prev) => ({ ...prev, [teamId]: !prev[teamId] }));
  };

  const handleFieldChange = (teamId, field, value) => {
    setTeams((prevTeams) =>
      prevTeams.map((team) =>
        team._id === teamId ? { ...team, [field]: value } : team
      )
    );
  };

  const handleSave = async (team) => {
    try {
      await api.put(`/teams/${team._id}`, team);
      setEditMode((prev) => ({ ...prev, [team._id]: false }));
    } catch (error) {
      console.error('Failed to update team', error);
    }
  };

  return (
    <div>
      <h2>Team List</h2>
      <table>
        <thead>
          <tr>
            <th>Team Name</th>
            <th>Reg-Date</th>
            <th>Group</th>
            <th>Edit</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((team) => (
            <tr key={team._id}>
              <td>
                {editMode[team._id] ? (
                  <input
                    type="text"
                    value={team.name}
                    onChange={(e) => handleFieldChange(team._id, 'name', e.target.value)}
                  />
                ) : (
                  team.name
                )}
              </td>
              <td>
                {editMode[team._id] ? (
                  <input
                    type="string"
                    value={team.registrationDate}
                    onChange={(e) =>
                      handleFieldChange(team._id, 'registrationDate', e.target.value)
                    }
                  />
                ) : (
                  team.registrationDate
                )}
              </td>
              <td>
                {team.groupNumber}
              </td>
              <td>
                {editMode[team._id] ? (
                  <button onClick={() => handleSave(team)}>Save</button>
                ) : (
                  <button onClick={() => handleEditClick(team._id)}>Edit</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TeamList;
