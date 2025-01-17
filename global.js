console.log("IT’S ALIVE!");

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

let pages = [
  { url: "/portfolio/index.html", title: "Home" },
  { url: "/portfolio/contact/index.html", title: "Contact" },
  { url: "/portfolio/projects/index.html", title: "Projects" },
  { url: "/portfolio/resume/index.html", title: "Resume" },
  { url: "https://github.com/LasyaYadlapati", title: "GitHub Profile" },
];

let nav = document.createElement("nav");
document.body.prepend(nav);

for (let p of pages) {
  let url = p.url;
  let title = p.title;
  let a = document.createElement("a");
  a.href = url;
  a.textContent = title;
  nav.append(a);
}

const ARE_WE_HOME = document.documentElement.classList.contains("home");
if (!ARE_WE_HOME && !url.startsWith("http")) {
  url = "../" + url;
}
