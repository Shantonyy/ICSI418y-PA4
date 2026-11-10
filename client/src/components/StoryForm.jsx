import { useState, useEffect } from "react";

export default function StoryForm({ projectId, members, editingStory, onSaved, onCancel }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [status, setStatus] = useState("To Do");
  const [assignedUserId, setAssignedUserId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (editingStory) {
      setTitle(editingStory.title);
      setDescription(editingStory.description);
      setPriority(editingStory.priority);
      setStatus(editingStory.status);
      setAssignedUserId(editingStory.assigned_user_id || "");
    } else {
      setTitle("");
      setDescription("");
      setPriority("Medium");
      setStatus("To Do");
      setAssignedUserId("");
    }
    setError("");
  }, [editingStory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const body = {
      title,
      description,
      priority,
      assigned_user_id: assignedUserId === "" ? null : assignedUserId,
    };

    let url = `http://localhost:9000/api/projects/${projectId}/stories`;
    let method = "POST";

    if (editingStory) {
      url += `/${editingStory._id}`;
      method = "PUT";
      body.status = status;
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Something went wrong");

      onSaved();
      if (!editingStory) {
        setTitle("");
        setDescription("");
        setPriority("Medium");
        setAssignedUserId("");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ border: "1px solid #ccc", padding: "15px", margin: "15px 0", borderRadius: "8px", backgroundColor: "#f9f9f9" }}>
      <h4>{editingStory ? "Edit Story" : "Create New Story"}</h4>
      {error && <p style={{ color: "red" }}>{error}</p>}
      
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <input 
          value={title} onChange={(e) => setTitle(e.target.value)} 
          placeholder="Title" required 
          style={{ padding: "8px" }}
        />
        <textarea 
          value={description} onChange={(e) => setDescription(e.target.value)} 
          placeholder="As a [user], I want [goal], so that [benefit]" required 
          style={{ padding: "8px" }}
        />
        
        <div>
          <label>Priority: </label>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} style={{ padding: "5px" }}>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        {editingStory && (
          <div>
            <label>Status: </label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ padding: "5px" }}>
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
            </select>
          </div>
        )}

        <div>
          <label>Assigned Member: </label>
          <select value={assignedUserId} onChange={(e) => setAssignedUserId(e.target.value)} style={{ padding: "5px" }}>
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m._id} value={m._id}>
                {m.username || m.f_name || "Unknown User"}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginTop: "10px" }}>
          <button type="submit" style={{ padding: "8px 16px", cursor: "pointer" }}>
            {editingStory ? "Save Changes" : "Create Story"}
          </button>
          {editingStory && (
            <button type="button" onClick={onCancel} style={{ marginLeft: "10px", padding: "8px 16px", cursor: "pointer" }}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}