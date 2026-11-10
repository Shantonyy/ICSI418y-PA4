require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();
app.use(express.json());
app.use(cors());

const client = new MongoClient(process.env.MONGO_URI);

async function connectDatabase() 
{
    try 
    {
        await client.connect();
        console.log("Connected to MongoDB");
    } catch (error) 
    {
        console.error("Could not connect to MongoDB");
        console.error(error);
    }
}
connectDatabase();

app.get("/", (req, res) => 
{
    res.json({ message: "Server is running" });
});

app.post("/signup", async (req, res) => 
{
    try 
    {
        const { f_name, l_name, username, password } = req.body;

        if (!f_name || !l_name || !username || !password) {
            return res.status(400).json({ message: "Required information is missing" });
        }

        const db = client.db("pa2");
        const users = db.collection("users");

        const existing = await users.findOne({ username });
        if (existing) {
            return res.status(409).json({ message: "Username already exists" });
        }

        await users.insertOne({ f_name, l_name, username, password });

        return res.status(201).json({ message: "User created successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
});

app.post("/login", async (req, res) =>
{
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: "Required information is missing" });
        }

        const db = client.db("pa2");
        const users = db.collection("users");

        const user = await users.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: "Username does not exist" });
        }

        if (user.password !== password) {
            return res.status(401).json({ message: "Incorrect password" });
        }

        return res.status(200).json({ message: "Login successful" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
});

app.get("/api/users", async (req, res) => {
    try {
        const db = client.db("pa2");
        const users = db.collection("users");
        const userList = await users.find({}).toArray();
        return res.status(200).json(userList);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
});

app.post("/api/projects", async (req, res) => {
    try {
        const { name, description, status, project_lead_id } = req.body;

        if (!name || !description || !status || !project_lead_id) {
            return res.status(400).json({ message: "Required fields are missing" });
        }

        if (!ObjectId.isValid(project_lead_id)) {
            return res.status(400).json({ message: "Invalid project lead ID" });
        }

        const db = client.db("pa2");
        const users = db.collection("users");
        const projects = db.collection("projects");
        const memberships = db.collection("project_memberships");

        const leadUser = await users.findOne({ _id: new ObjectId(project_lead_id) });
        if (!leadUser) {
            return res.status(404).json({ message: "Project lead user not found" });
        }

        const projectResult = await projects.insertOne({
            name,
            description,
            status,
            project_lead_id: new ObjectId(project_lead_id)
        });

        const projectId = projectResult.insertedId;

        await memberships.insertOne({
            project_id: projectId,
            user_id: new ObjectId(project_lead_id)
        });

        return res.status(201).json({ message: "Project created successfully", projectId });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
});

app.get("/api/projects", async (req, res) => {
    try {
        const db = client.db("pa2");
        const projects = db.collection("projects");
        const projectList = await projects.find({}).toArray();
        return res.status(200).json(projectList);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
});

app.get("/api/projects/:projectId/members", async (req, res) => {
    try {
        const { projectId } = req.params;

        if (!ObjectId.isValid(projectId)) {
            return res.status(400).json({ message: "Invalid project ID" });
        }

        const db = client.db("pa2");
        const projects = db.collection("projects");
        const memberships = db.collection("project_memberships");

        const project = await projects.findOne({ _id: new ObjectId(projectId) });
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const membershipList = await memberships.find({ project_id: new ObjectId(projectId) }).toArray();
        
        const userIds = membershipList.map(m => m.user_id);

        const users = await db.collection("users").find({ 
            _id: { $in: userIds } 
        }).toArray();

        return res.status(200).json(users);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
});

app.post("/api/projects/:projectId/members", async (req, res) => {
    try {
        const { projectId } = req.params;
        const { user_id } = req.body;

        if (!ObjectId.isValid(projectId) || !ObjectId.isValid(user_id)) {
            return res.status(400).json({ message: "Invalid project ID or user ID" });
        }

        const db = client.db("pa2");
        const projects = db.collection("projects");
        const users = db.collection("users");
        const memberships = db.collection("project_memberships");

        const project = await projects.findOne({ _id: new ObjectId(projectId) });
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const user = await users.findOne({ _id: new ObjectId(user_id) });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const existingMembership = await memberships.findOne({
            project_id: new ObjectId(projectId),
            user_id: new ObjectId(user_id)
        });

        if (existingMembership) {
            return res.status(409).json({ message: "User is already a member of this project" });
        }

        await memberships.insertOne({
            project_id: new ObjectId(projectId),
            user_id: new ObjectId(user_id)
        });

        return res.status(201).json({ message: "Member added successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
});

app.delete("/api/projects/:projectId/members/:userId", async (req, res) => {
    try {
        const { projectId, userId } = req.params;

        if (!ObjectId.isValid(projectId) || !ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid project ID or user ID" });
        }

        const db = client.db("pa2");
        const projects = db.collection("projects");
        const memberships = db.collection("project_memberships");

        const project = await projects.findOne({ _id: new ObjectId(projectId) });
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        if (project.project_lead_id.equals(new ObjectId(userId))) {
            return res.status(400).json({ message: "Cannot remove project lead" });
        }

        const assignedStory = await db.collection("user_stories").findOne({
            project_id: new ObjectId(projectId),
            assigned_user_id: new ObjectId(userId)
        });

        if (assignedStory) {
            return res.status(409).json({ 
                message: "Reassign, unassign, or delete this member's stories before removing them from the project." 
            });
        }

        const result = await memberships.deleteOne({
            project_id: new ObjectId(projectId),
            user_id: new ObjectId(userId)
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "Membership not found" });
        }

        return res.status(200).json({ message: "Member removed successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
});

app.get("/api/projects/:projectId/stories", async (req, res) => {
    try {
        const { projectId } = req.params;
        if (!ObjectId.isValid(projectId)) {
            return res.status(400).json({ message: "Invalid project ID" });
        }

        const db = client.db("pa2");
        const stories = await db.collection("user_stories")
            .find({ project_id: new ObjectId(projectId) })
            .toArray();
            
        return res.status(200).json(stories);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
});

app.post("/api/projects/:projectId/stories", async (req, res) => {
    try {
        const { projectId } = req.params;
        const { title, description, priority, assigned_user_id } = req.body;

        if (!ObjectId.isValid(projectId)) {
            return res.status(400).json({ message: "Invalid project ID" });
        }

        if (!title || !title.trim() || !description || !description.trim()) {
            return res.status(400).json({ message: "Title and description are required." });
        }
        if (!["High", "Medium", "Low"].includes(priority)) {
            return res.status(400).json({ message: "Invalid priority." });
        }

        const db = client.db("pa2");
        
        let finalAssignee = null;
        if (assigned_user_id) {
            if (!ObjectId.isValid(assigned_user_id)) {
                return res.status(400).json({ message: "Invalid user ID" });
            }
            finalAssignee = new ObjectId(assigned_user_id);
            
            const isMember = await db.collection("project_memberships").findOne({
                project_id: new ObjectId(projectId),
                user_id: finalAssignee
            });
            if (!isMember) {
                return res.status(400).json({ message: "Assigned user is not a member of this project." });
            }
        }

        const newStory = {
            project_id: new ObjectId(projectId),
            title: title.trim(),
            description: description.trim(),
            priority,
            status: "To Do",
            assigned_user_id: finalAssignee
        };

        const result = await db.collection("user_stories").insertOne(newStory);
        return res.status(201).json({ ...newStory, _id: result.insertedId });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
});

app.put("/api/projects/:projectId/stories/:storyId", async (req, res) => {
    try {
        const { projectId, storyId } = req.params;
        const { title, description, priority, status, assigned_user_id } = req.body;

        if (!ObjectId.isValid(projectId) || !ObjectId.isValid(storyId)) {
            return res.status(400).json({ message: "Invalid IDs." });
        }

        if (!title || !title.trim() || !description || !description.trim()) {
            return res.status(400).json({ message: "Title and description are required." });
        }
        if (!["High", "Medium", "Low"].includes(priority)) {
            return res.status(400).json({ message: "Invalid priority." });
        }
        if (!["To Do", "In Progress", "Done"].includes(status)) {
            return res.status(400).json({ message: "Invalid status." });
        }

        const db = client.db("pa2");

        let finalAssignee = null;
        if (assigned_user_id) {
            if (!ObjectId.isValid(assigned_user_id)) {
                return res.status(400).json({ message: "Invalid user ID" });
            }
            finalAssignee = new ObjectId(assigned_user_id);
            const isMember = await db.collection("project_memberships").findOne({
                project_id: new ObjectId(projectId),
                user_id: finalAssignee
            });
            if (!isMember) {
                return res.status(400).json({ message: "Assigned user is not a member of this project." });
            }
        }

        const result = await db.collection("user_stories").updateOne(
            { _id: new ObjectId(storyId), project_id: new ObjectId(projectId) },
            { 
                $set: { 
                    title: title.trim(), 
                    description: description.trim(), 
                    priority, 
                    status, 
                    assigned_user_id: finalAssignee 
                } 
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: "Story not found in this project." });
        }
        return res.status(200).json({ message: "Story updated successfully." });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
});

app.delete("/api/projects/:projectId/stories/:storyId", async (req, res) => {
    try {
        const { projectId, storyId } = req.params;

        if (!ObjectId.isValid(projectId) || !ObjectId.isValid(storyId)) {
            return res.status(400).json({ message: "Invalid IDs." });
        }

        const db = client.db("pa2");
        const result = await db.collection("user_stories").deleteOne({
            _id: new ObjectId(storyId),
            project_id: new ObjectId(projectId)
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "Story not found." });
        }
        return res.status(200).json({ message: "Story deleted." });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
});

app.listen(9000, () => 
{
    console.log("Server running on port 9000");
});