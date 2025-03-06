let data = [];
let xScale, yScale;
let selectedCommits = [];
let commits = [];
let filteredCommits = [];
let filteredLines = [];
let files = [];

async function loadData() {
  data = await d3.csv("loc.csv", (row) => ({
    ...row,
    line: Number(row.line),
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + "T00:00" + row.timezone),
    datetime: new Date(row.datetime),
  }));
  processCommits();
  displayStats();
  updateFileVis();
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadData();
  createScatterplot();
});

commits = d3.groups(data, (d) => d.commit);

function processCommits() {
  commits = d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      let first = lines[0];
      let { author, date, time, timezone, datetime } = first;
      let ret = {
        id: commit,
        url: "https://github.com/LasyaYadlapati/portfolio/commit/" + commit,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length,
      };

      Object.defineProperty(ret, "lines", {
        value: lines,
        configurable: false,
        writable: false,
        enumerable: false,
      });

      return ret;
    });
  commits.sort((a, b) => d3.ascending(a.datetime, b.datetime));

  let commitProgress = 100;
  let timeScale = d3.scaleTime(
    [d3.min(commits, (d) => d.datetime), d3.max(commits, (d) => d.datetime)],
    [0, 100]
  );
  let commitMaxTime = timeScale.invert(commitProgress);

  // Update global filteredCommits and filteredLines
  filteredCommits = commits.filter((d) => d.datetime <= commitMaxTime);
  filteredLines = data.filter((d) => d.datetime <= commitMaxTime);

  const timeSlider = d3.select("#time-slider");
  const selectedTime = d3.select("#selectedTime");

  selectedTime.text(
    timeScale.invert(commitProgress).toLocaleString("default", {
      dateStyle: "long",
      timeStyle: "short",
    })
  );

  timeSlider.on("input", function () {
    commitProgress = +this.value;

    commitMaxTime = timeScale.invert(commitProgress);

    selectedTime.text(
      timeScale.invert(commitProgress).toLocaleString("default", {
        dateStyle: "long",
        timeStyle: "short",
      })
    );

    filteredCommits = commits.filter((d) => d.datetime <= commitMaxTime);
    filteredLines = data.filter((d) => d.datetime <= commitMaxTime);

    createScatterplot();
    displayStats();
    updateFileVis();
  });
}

function displayStats() {
  d3.select("#stats").html("");

  const dl = d3.select("#stats").append("dl").attr("class", "stats");

  dl.append("dt").html('TOTAL <abbr title="Lines of code">LOC</abbr>');
  dl.append("dd").text(filteredLines.length);

  dl.append("dt").text("TOTAL COMMITS");
  dl.append("dd").text(filteredCommits.length);

  const uniqueFiles = [...new Set(filteredLines.map((d) => d.file))];
  dl.append("dt").text("NUMBER OF FILES");
  dl.append("dd").text(uniqueFiles.length);

  const fileLengths = d3.rollup(
    filteredLines,
    (v) => v.length,
    (d) => d.file
  );

  const avgFileLength = d3.mean(Array.from(fileLengths.values()));
  dl.append("dt").text("AVG FILE LENGTH");
  dl.append("dd").text(Math.round(avgFileLength));

  const dayOfWeek = d3.rollup(
    filteredCommits,
    (v) => v.length,
    (d) => d.datetime.getDay()
  );
  const mostActiveDay = d3.max(Array.from(dayOfWeek.values()));
  const activeDayIndex = [...dayOfWeek].find(
    ([day, count]) => count === mostActiveDay
  )[0];
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  dl.append("dt").text("MOST ACTIVE ON");
  dl.append("dd").text(days[activeDayIndex]);
}

function createScatterplot() {
  d3.select("#chart").html("");

  const width = 1000;
  const height = 600;

  const sortedCommits = d3.sort(filteredCommits, (d) => -d.totalLines);

  const svg = d3
    .select("#chart")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .style("overflow", "visible");

  xScale = d3
    .scaleTime()
    .domain(d3.extent(filteredCommits, (d) => d.datetime))
    .range([0, width])
    .nice();

  yScale = d3.scaleLinear().domain([0, 24]).range([height, 0]);

  const [minLines, maxLines] = d3.extent(filteredCommits, (d) => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);

  const dots = svg.append("g").attr("class", "dots");

  dots
    .selectAll("circle")
    .data(sortedCommits)
    .join("circle")
    .attr("cx", (d) => xScale(d.datetime))
    .attr("cy", (d) => yScale(d.hourFrac))
    .attr("r", (d) => rScale(d.totalLines))
    .attr("fill", "steelblue")
    .style("fill-opacity", 0.8)
    .on("mouseenter", function (event, d) {
      d3.select(this)
        .style("fill-opacity", 1)
        .classed("selected", isCommitSelected(d));
      updateTooltipContent(d);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on("mouseleave", function (d) {
      d3.select(this)
        .style("fill-opacity", 0.7)
        .classed("selected", isCommitSelected(d));
      updateTooltipContent({});
      updateTooltipVisibility(false);
    });

  const margin = { top: 10, right: 10, bottom: 30, left: 20 };

  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  xScale.range([usableArea.left, usableArea.right]);
  yScale.range([usableArea.bottom, usableArea.top]);

  const xAxis = d3.axisBottom(xScale);

  const yAxis = d3
    .axisLeft(yScale)
    .tickFormat((d) => String(d % 24).padStart(2, "0") + ":00");

  svg
    .append("g")
    .attr("transform", `translate(0, ${usableArea.bottom})`)
    .call(xAxis);

  svg
    .append("g")
    .attr("transform", `translate(${usableArea.left}, 0)`)
    .call(yAxis);

  const gridlines = svg
    .append("g")
    .attr("class", "gridlines")
    .attr("transform", `translate(${usableArea.left}, 0)`);

  gridlines.call(
    d3.axisLeft(yScale).tickFormat("").tickSize(-usableArea.width)
  );

  brushSelector();
}

function updateTooltipContent(commit) {
  const link = document.getElementById("commit-link");
  const date = document.getElementById("commit-date");
  const time = document.getElementById("commit-time");
  const author = document.getElementById("commit-author");
  const lines = document.getElementById("commit-lines");

  if (Object.keys(commit).length === 0) return;

  link.href = commit.url;
  link.textContent = commit.id;
  date.textContent = commit.datetime?.toLocaleString("en", {
    dateStyle: "full",
  });
  time.textContent = commit.datetime?.toLocaleString("en", {
    timeStyle: "short",
  });
  author.textContent = commit.author;
  lines.textContent = commit.totalLines;
}

function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById("commit-tooltip");
  tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById("commit-tooltip");
  tooltip.style.left = `${event.clientX}px`;
  tooltip.style.top = `${event.clientY}px`;
}

function brushSelector() {
  const svg = document.querySelector("svg");

  d3.select(svg).call(d3.brush().on("start brush end", brushed));
  d3.select(svg).selectAll(".dots, .overlay ~ *").raise();
}

let brushSelection = null;

function brushed(evt) {
  let brushSelection = evt.selection;
  selectedCommits = !brushSelection
    ? []
    : filteredCommits.filter((commit) => {
        let min = { x: brushSelection[0][0], y: brushSelection[0][1] };
        let max = { x: brushSelection[1][0], y: brushSelection[1][1] };
        let x = xScale(commit.date);
        let y = yScale(commit.hourFrac);

        return x >= min.x && x <= max.x && y >= min.y && y <= max.y;
      });
  updateSelection();
  updateLanguageBreakdown();
  updateSelectionCount();
}

function isCommitSelected(commit) {
  return selectedCommits.includes(commit);
}

function updateSelection() {
  d3.selectAll("circle").classed("selected", (d) => isCommitSelected(d));
}

function updateSelectionCount() {
  const countElement = document.getElementById("selection-count");
  countElement.textContent = `${
    selectedCommits.length || "No"
  } commits selected`;

  return selectedCommits;
}

function updateLanguageBreakdown() {
  const container = document.getElementById("language-breakdown");

  if (selectedCommits.length === 0) {
    container.innerHTML = "";
    return;
  }
  const requiredCommits = selectedCommits.length ? selectedCommits : commits;
  const lines = requiredCommits.flatMap((d) => d.lines);

  const breakdown = d3.rollup(
    lines,
    (v) => v.length,
    (d) => d.type
  );

  container.innerHTML = "";

  for (const [language, count] of breakdown) {
    const proportion = count / lines.length;
    const formatted = d3.format(".1~%")(proportion);

    container.innerHTML += `
            <dt>${language}</dt>
            <dd>${count} lines (${formatted})</dd>
        `;
  }

  return breakdown;
}

function updateFileVis() {
  let files = d3
    .groups(filteredLines, (d) => d.file)
    .map(([name, lines]) => {
      return { name, lines };
    });

  files = d3.sort(files, (d) => -d.lines.length);

  d3.select(".files").selectAll("div").remove();
  const filesContainer = d3
    .select(".files")
    .selectAll("div")
    .data(files)
    .enter()
    .append("div");

  let fileTypeColors = d3.scaleOrdinal(d3.schemeTableau10);

  filesContainer
    .append("dt")
    .append("code")
    .text((d) => d.name);

  filesContainer
    .append("dd")
    .attr("class", "unit-vis")
    .selectAll("div.line")
    .data((d) => d.lines)
    .enter()
    .append("div")
    .attr("class", "line")
    .style("background", (d) => fileTypeColors(d.type));
}
