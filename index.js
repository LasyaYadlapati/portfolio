import {
  fetchJSON,
  renderProjects,
  fetchGitHubData,
} from "../portfolio/global.js";
const projects = await fetchJSON("../portfolio/lib/projects.json");
const latestProjects = projects.slice(0, 2);

const projectsContainer = document.querySelector(".projects");
renderProjects(latestProjects, projectsContainer, "h2");

const githubData = await fetchGitHubData("LasyaYadlapati");
const profileStats = document.querySelector("#profile-stats");

if (profileStats) {
  profileStats.innerHTML = `
        <dl>
          <dt>PUBLIC REPOS</dt><dd>${githubData.public_repos}</dd>
          <dt>PUBLIC GISTS</dt><dd>${githubData.public_gists}</dd>
          <dt>FOLLOWERS</dt><dd>${githubData.followers}</dd>
          <dt>FOLLOWING</dt><dd>${githubData.following}</dd>
        </dl>
    `;
}
