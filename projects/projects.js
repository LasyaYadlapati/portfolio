import { fetchJSON, renderProjects } from "../global.js";
const projects = await fetchJSON("../lib/projects.json");
// const latestProjects = projects.slice(0, 4);

const projectsContainer = document.querySelector(".projects");
renderProjects(projects, projectsContainer, "h2");
