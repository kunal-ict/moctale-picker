const API_URL = "https://moctale-picker-api.anand-kunal5859.workers.dev";

const $ = (id) => document.getElementById(id);
const spinBtn = $("spinBtn");
const wheel = $("wheel");
const resultNumber = $("resultNumber");
const resultTitle = $("resultTitle");
const resultYear = $("resultYear");
const resultStatus = $("resultStatus");
const historyList = $("historyList");
const historyCount = $("historyCount");
const syncState = $("syncState");

let history = [];
let currentRotation = 0;
let busy = false;

function movieByRank(rank) {
  return MOVIES.find(m => Number(m.rank) === Number(rank)) || {
    rank,
    title: `Moctale #${rank}`,
    year: ""
  };
}

function uniqueAvailableRanks() {
  const used = new Set(history.map(Number));
  return MOVIES.map(m => Number(m.rank)).filter(rank => !used.has(rank));
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[c]));
}

function renderHistory() {
  historyCount.textContent = history.length;

  if (!history.length) {
    historyList.innerHTML = `<div class="empty-state">No picks yet.</div>`;
    return;
  }

  historyList.innerHTML = history.slice().reverse().map(rank => {
    const movie = movieByRank(rank);
    return `
      <div class="history-item">
        <div class="history-rank">#${rank}</div>
        <div>
          <div class="history-title">${escapeHtml(movie.title)}</div>
          <div class="history-meta">${movie.year ? escapeHtml(String(movie.year)) : "Year unavailable"}</div>
        </div>
        <div class="history-time">Picked</div>
      </div>`;
  }).join("");
}

async function loadHistory() {
  syncState.textContent = "Syncing…";

  try {
    const response = await fetch(`${API_URL}/history`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    history = Array.isArray(data.history) ? data.history.map(Number) : [];
    syncState.textContent = "Synced";
    renderHistory();
  } catch (error) {
    console.error(error);
    syncState.textContent = "Offline";
    resultStatus.textContent = "Couldn't connect to the history server.";
    historyList.innerHTML = `<div class="empty-state">Couldn't load history.</div>`;
  }
}

async function savePick(rank) {
  const response = await fetch(`${API_URL}/history`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ number: rank })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Could not save pick");

  history = Array.isArray(data.history) ? data.history.map(Number) : history;
  renderHistory();
}

async function spin() {
  if (busy) return;

  const available = uniqueAvailableRanks();
  if (!available.length) {
    resultStatus.textContent = "You've already picked all 100 movies.";
    return;
  }

  busy = true;
  spinBtn.disabled = true;
  resultStatus.textContent = "Finding an unseen movie…";
  resultNumber.textContent = "…";
  resultTitle.textContent = "Spinning";
  resultYear.textContent = "";

  const rank = randomFrom(available);
  const segment = 360 / 100;
  const targetAngle = 360 - ((rank - 0.5) * segment);
  const extraTurns = 6 + Math.floor(Math.random() * 4);
  const normalized = ((currentRotation % 360) + 360) % 360;
  const delta = extraTurns * 360 + ((targetAngle - normalized + 360) % 360);
  currentRotation += delta;
  wheel.style.transform = `rotate(${currentRotation}deg)`;

  setTimeout(async () => {
    try {
      await savePick(rank);
      const movie = movieByRank(rank);
      resultNumber.textContent = rank;
      resultTitle.textContent = movie.title || `Moctale #${rank}`;
      resultYear.textContent = movie.year ? String(movie.year) : "";
      resultStatus.textContent = "Locked in. It won't appear again.";
      syncState.textContent = "Synced";
    } catch (error) {
      console.error(error);
      resultStatus.textContent = "Couldn't save this pick. Nothing was added to history.";
      await loadHistory();
    } finally {
      busy = false;
      spinBtn.disabled = false;
    }
  }, 4100);
}

async function clearHistory() {
  if (!history.length) return;
  if (!confirm("Delete the entire watch history?")) return;

  try {
    const response = await fetch(`${API_URL}/history`, { method: "DELETE" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    history = [];
    renderHistory();
    resultStatus.textContent = "History cleared.";
  } catch (error) {
    console.error(error);
    alert("Couldn't clear history.");
  }
}

document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    btn.classList.add("active");
    $(`${btn.dataset.tab}Tab`).classList.add("active");
  });
});

spinBtn.addEventListener("click", spin);
$("clearHistoryBtn").addEventListener("click", clearHistory);

loadHistory();
