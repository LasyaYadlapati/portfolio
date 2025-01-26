console.log("IT’S ALIVE!");

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

const ARE_WE_HOME = document.documentElement.classList.contains("home");
const navLinks = $$("nav a");

let pages = [
  { url: "../portfolio/index.html", title: "Home" },
  { url: "../portfolio/contact/index.html", title: "Contact" },
  { url: "../portfolio/projects/index.html", title: "Projects" },
  { url: "../portfolio/resume/index.html", title: "Resume" },
  { url: "https://github.com/LasyaYadlapati", title: "GitHub Profile" },
];

let nav = document.createElement("nav");
document.body.prepend(nav);

for (let p of pages) {
  let url = p.url;
  let title = p.title;

  if (!ARE_WE_HOME && !url.startsWith("http")) {
    url = !ARE_WE_HOME && !url.startsWith("http") ? "../" + url : url;
  }

  let a = document.createElement("a");
  a.href = url;
  a.textContent = title;
  nav.append(a);

  let currentLink = navLinks.find(
    (a) => a.host === location.host && a.pathname === location.pathname
  );

  if (currentLink) {
    currentLink.classList.add("current");
  }

  if (a.host === location.host && a.pathname === location.pathname) {
    a.classList.add("current");
  }

  if (a.host !== location.host) {
    a.target = "_blank";
  }
}

document.body.insertAdjacentHTML(
  "afterbegin",
  `
    <label class="color-scheme">
      Theme:
      <select name="color-scheme">
        <option value="light dark">Automatic</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
  `
);

const select = document.querySelector('select[name="color-scheme"]');

if ("colorScheme" in localStorage) {
  document.documentElement.style.setProperty(
    "color-scheme",
    localStorage.colorScheme
  );
  select.value = localStorage.colorScheme;
}

select.addEventListener("input", function (event) {
  console.log("color scheme changed to", event.target.value);

  document.documentElement.style.setProperty(
    "color-scheme",
    event.target.value
  );

  localStorage.colorScheme = event.target.value;
});

export async function fetchJSON(url) {
  try {
    // Fetch the JSON file from the given URL
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }
  } catch (error) {
    console.error("Error fetching or parsing JSON data:", error);
  }
}
