import { useState } from "react";
import Signup from "./components/Signup";
import Login from "./components/Login";
import CreateProject from "./components/CreateProject";
import ProjectList from "./components/ProjectList";
import ProjectMembers from "./components/ProjectMembers";
import ProjectBacklog from "./components/ProjectBacklog";
import "./App.css";

function App()
{
    const [view, setView] = useState("signup");
    const [selectedProject, setSelectedProject] = useState(null);

    return (
        <div>
            <h1>ICSI 418Y - PA4</h1>
            <div>
                <button onClick={() => { setView("signup"); setSelectedProject(null); }}>Signup</button>
                <button onClick={() => { setView("login"); setSelectedProject(null); }}>Login</button>
                <button onClick={() => { setView("createProject"); setSelectedProject(null); }}>Create Project</button>
                <button onClick={() => { setView("projectList"); setSelectedProject(null); }}>View Projects</button>
                {/* NEW BUTTON FOR PA4 */}
                <button onClick={() => { setView("backlog"); setSelectedProject(null); }}>Project Backlog</button>
            </div>
            <hr />
            
            {view === "signup" && <Signup />}
            {view === "login" && <Login />}
            {view === "createProject" && <CreateProject />}
            {view === "projectList" && !selectedProject && <ProjectList onSelectProject={setSelectedProject} />}
            {view === "projectList" && selectedProject && <ProjectMembers project={selectedProject} onBack={() => setSelectedProject(null)} />}
            
            {/* NEW VIEW FOR PA4 */}
            {view === "backlog" && <ProjectBacklog />}
        </div>
    );
}

export default App;