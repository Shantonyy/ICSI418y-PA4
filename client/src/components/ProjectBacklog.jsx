import { useEffect, useState } from "react";
import StoryForm from "./StoryForm";

export default function ProjectBacklog() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [stories, setStories] = useState([]);
  const [members, setMembers] = useState([]);
  const [editingStory, setEditingStory] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://localhost:9000/api/projects")
      .then((res) => res.json())
      .then((data) => setProjects(data))
      .catch((err) => setError("Failed to load projects"));
  }, []);

  const loadData = async (projectId) => {
    if (!projectId) {
      setStories([]);
      setMembers([]);
      return;
    }
    setError("");
    setEditingStory(null); 

    try {
      const [storiesRes, membersRes] = await Promise.all([
        fetch(`http://localhost:9000/api/projects/${projectId}/stories`),
        fetch(`http://localhost:9000/api/projects/${projectId}/members`),
      ]);
      
      const storiesData = await storiesRes.json();
      const membersData = await membersRes.json();
      
      setStories(storiesData);
      setMembers(membersData);
    } catch (err) {
      setError("Failed to load backlog data");
    }
  };

  useEffect(() => {
    loadData(selectedProject);
  }, [selectedProject]);

  const handleDelete = async (storyId) => {
    if (!window.confirm("Are you sure you want to delete this story?")) return;
    
    try {
      const res = await fetch(`http://localhost:9000/api/projects/${selectedProject}/stories/${storyId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        loadData(selectedProject); 
      } else {
        const data = await res.json();
        alert(data.message);
      }
    } catch (err) {
      alert("Error deleting story");
    }
  };

  const getMemberName = (userId) => {
    if (!userId) return "Unassigned";
    const member = members.find((m) => m._id === userId);
    return member ? (member.username || member.f_name) : "Unknown";
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h2>Project Backlog</h2>
      
      <select 
        value={selectedProject} 
        onChange={(e) => setSelectedProject(e.target.value)}
        style={{ padding: "8px", marginBottom: "20px", width: "100%", maxWidth: "300px" }}
      >
        <option value=""> Select a Project </option>
        {projects.map((p) => (
          <option key={p._id} value={p._id}>{p.name}</option>
        ))}
      </select>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {selectedProject && (
        <>
          <StoryForm 
            projectId={selectedProject} 
            members={members} 
            editingStory={editingStory}
            onSaved={() => loadData(selectedProject)}
            onCancel={() => setEditingStory(null)}
          />

          <h3>Stories</h3>
          {stories.length === 0 ? (
            <p>No stories in this project yet.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {stories.map((story) => (
                <li key={story._id} style={{ border: "1px solid #ccc", padding: "15px", marginBottom: "15px", borderRadius: "8px", backgroundColor: "#fff" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ fontSize: "1.1em" }}>{story.title}</strong>
                    <div>
                      <button onClick={() => setEditingStory(story)} style={{ marginRight: "10px", padding: "5px 10px", cursor: "pointer" }}>Edit</button>
                      <button onClick={() => handleDelete(story._id)} style={{ backgroundColor: "#ff4d4d", color: "white", border: "none", padding: "5px 10px", cursor: "pointer", borderRadius: "4px" }}>Delete</button>
                    </div>
                  </div>
                  <div style={{ marginTop: "10px", fontSize: "0.9em", color: "#555" }}>
                    <span style={{ marginRight: "15px" }}>Priority: <b>{story.priority}</b></span> 
                    <span style={{ marginRight: "15px" }}>Status: <b>{story.status}</b></span> 
                    <span>Assigned: <b>{getMemberName(story.assigned_user_id)}</b></span>
                  </div>
                  <p style={{ marginTop: "10px", fontStyle: "italic", color: "#333" }}>
                    "{story.description}"
                  </p>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}