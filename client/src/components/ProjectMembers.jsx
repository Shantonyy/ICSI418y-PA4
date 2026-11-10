import { useState, useEffect } from "react";

function ProjectMembers({ project, onBack }) {
    const [members, setMembers] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (project) {
            fetchMembers();
            fetchUsers();
        }
    }, [project]);

    const fetchMembers = async () => {
        try {
            const response = await fetch(
                `http://localhost:9000/api/projects/${project._id}/members`
            );
            const data = await response.json();
            setMembers(data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await fetch("http://localhost:9000/api/users");
            const data = await response.json();
            setUsers(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleAddMember = async (e) => {
        e.preventDefault();
        setMessage("");

        try {
            const response = await fetch(
                `http://localhost:9000/api/projects/${project._id}/members`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ user_id: selectedUserId }),
                }
            );

            const data = await response.json();

            if (response.ok) {
                setMessage("Member added successfully!");
                setSelectedUserId("");
                fetchMembers();
            } else {
                setMessage(data.message || "Failed to add member");
            }
        } catch (error) {
            setMessage("Error adding member");
            console.error(error);
        }
    };

    const handleRemoveMember = async (userId) => {
        setMessage("");

        try {
            const response = await fetch(
                `http://localhost:9000/api/projects/${project._id}/members/${userId}`,
                {
                    method: "DELETE",
                }
            );

            const data = await response.json();

            if (response.ok) {
                setMessage("Member removed successfully!");
                fetchMembers();
            } else {
                setMessage(data.message || "Failed to remove member");
            }
        } catch (error) {
            setMessage("Error removing member");
            console.error(error);
        }
    };

    const availableUsers = users.filter(user => 
        !members.some(member => member._id === user._id)
    );

    if (!project) {
        return <p>No project selected</p>;
    }

    return (
        <div>
            <button onClick={onBack}>Back to Projects</button>
            <h2>Project Members: {project.name}</h2>
            {message && <p style={{ color: message.includes("success") ? "green" : "red" }}>{message}</p>}

            <h3>Add Member</h3>
            <form onSubmit={handleAddMember}>
                <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    required
                >
                    <option value="">Select a user</option>
                    {availableUsers.map((user) => (
                        <option key={user._id} value={user._id}>
                            {user.username}
                        </option>
                    ))}
                </select>
                <button type="submit">Add Member</button>
            </form>

            <h3>Current Members</h3>
            {members.length === 0 ? (
                <p>No members found</p>
            ) : (
                <ul>
                    {members.map((member) => (
                        <li key={member._id}>
                            {/* We now use member.username because the backend returns the user object directly */}
                            {member.username || member.f_name || "Unknown User"}
                            
                            {/* Compare member._id instead of member.user_id */}
                            {member._id !== project.project_lead_id && (
                                <button
                                    onClick={() => handleRemoveMember(member._id)}
                                    style={{ marginLeft: "10px" }}
                                >
                                    Remove
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default ProjectMembers;