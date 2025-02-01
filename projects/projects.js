import { fetchJSON, renderProjects } from "../global.js";
const projects = await fetchJSON("../lib/projects.json");
// const latestProjects = projects.slice(0, 4);

const projectsContainer = document.querySelector(".projects");
renderProjects(projects, projectsContainer, "h2");

const projectCount = projects.length;
const projectsTitle = document.querySelector(".projects-title");
if (projectsTitle) {
  projectsTitle.textContent = `${projectCount} Projects`;
}
