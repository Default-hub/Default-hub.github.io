const API_DEFAULT = "https://asap-pscl-api.juggernog193.workers.dev";
const KEYS = { events: "asap-pscl-events-v2", api: "asap-pscl-api-base-v2", results: "asap-pscl-results-v2:", bracket: "asap-pscl-bracket-picks-v1" };
const STARTER_TEAMS = [
  { id: "central", name: "Central High School", players: [] },
  { id: "masterman", name: "Julia R. Masterman", players: [] },
  { id: "gwashington", name: "George Washington High School", players: [] },
  { id: "bodine", name: "Bodine", players: [] },
  { id: "swenson", name: "Swenson", players: [] },
  { id: "mastbaum", name: "Mastbaum", players: [] },
  { id: "northeast", name: "Northeast High School", players: [] },
  { id: "gwcarver", name: "G.W Carver High School", players: [] },
  { id: "palumbo", name: "Academy at Palumbo", players: [
    { id: "palumbo-b1", board: "B1", name: "Brandon Tran", memberId: "", rating: 1671, status: "In Team" },
    { id: "palumbo-b2", board: "B2", name: "Bryan Martinez-Hernandez", memberId: "", rating: 1473, status: "In Team" },
    { id: "palumbo-b3", board: "B3", name: "Mabinti Mansaray", memberId: "", rating: 1338, status: "In Team" },
    { id: "palumbo-b4", board: "B4", name: "Nina Yang", memberId: "", rating: 1122, status: "In Team" },
    { id: "palumbo-b5", board: "B5", name: "Johnfer Quispe", memberId: "", rating: 1128, status: "In Team" },
    { id: "palumbo-sub4", board: "Sub", name: "Faadi Garcia", memberId: "", rating: 1587, status: "Out Team" }
  ] },
  { id: "new-foundations", name: "New Foundations", players: [] },
  { id: "boyslatin", name: "BoysLatin", players: [] },
  { id: "franklin-learning-center", name: "Franklin Learning Center", players: [] }
];
const STARTER_EVENTS = [{ id: "pscl-25-26-test", name: "ASAP PSCL 25–26 (test event)", url: "https://ratings.uschess.org/event/202602240493", season: "2025-2026" }];
const $ = id => document.getElementById(id);
const clone = value => JSON.parse(JSON.stringify(value));
const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
const normId = value => String(value ?? "").replace(/\D/g, "");
const playerMemberId = player => player?.memberId ?? player?.uscf_id ?? player?.usChessId ?? "";
const numericScore = value => value === null || value === undefined || value === "" || !Number.isFinite(Number(value)) ? null : Number(value);
const formatNumber = value => value === null || value === undefined ? "—" : Number(value).toLocaleString(undefined, { maximumFractionDigits: 1 });
const boardNumber = board => board === "Sub" ? 99 : Number(String(board || "B99").replace(/\D/g, "") || 99);
const newId = prefix => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const validEventUrl = value => { try { const url = new URL(value); return url.protocol === "https:" && url.hostname === "ratings.uschess.org" && /^\/event\/[A-Za-z0-9_-]+\/?$/.test(url.pathname); } catch { return false; } };
function readLocal(key, fallback) { try { const value = JSON.parse(localStorage.getItem(key)); return value ?? clone(fallback); } catch { return clone(fallback); } }
function getApiBase() { return ($("api-base").value.trim() || API_DEFAULT).replace(/\/+$/, ""); }
function setStatus(message, type = "") { const node = $("event-status"); node.textContent = message; node.className = `notice ${type}`.trim(); }
function setConnection(mode, label) { const node = $("connection-indicator"); node.className = `connection ${mode}`.trim(); node.querySelector("span").textContent = label; }
function markDirty() { dirty = true; $("roster-save-state").textContent = "Unsaved roster changes"; $("roster-save-state").className = "save-state dirty"; }
function markSaved(message = "Shared roster is up to date") { dirty = false; $("roster-save-state").textContent = message; $("roster-save-state").className = "save-state saved"; }

let teams = clone(STARTER_TEAMS);
let events = readLocal(KEYS.events, STARTER_EVENTS);
let activeEvent = null;
let activeResults = [];
let dirty = false;
let loadedSharedRoster = false;

function getCachedEvent(event) {
  try {
    const stored = JSON.parse(localStorage.getItem(KEYS.results + event.id));
    if (Array.isArray(stored)) return { results: stored, eventInfo: null };
    if (stored && Array.isArray(stored.results)) return stored;
  } catch { /* cache can be missing or malformed */ }
  return { results: [], eventInfo: null };
}
function saveEvents() { localStorage.setItem(KEYS.events, JSON.stringify(events)); }
function cacheActiveEvent() { if (activeEvent) localStorage.setItem(KEYS.results + activeEvent.id, JSON.stringify({ results: activeResults, eventInfo: activeEvent.eventInfo || null })); }
function renderEventSelect() {
  const select = $("event-select");
  const previous = activeEvent?.id || select.value;
  select.innerHTML = events.map(event => `<option value="${esc(event.id)}">${esc(event.name)}</option>`).join("");
  if (!events.length) {
    select.innerHTML = '<option value="">No events yet</option>';
    activeEvent = null; activeResults = []; $("event-url").value = ""; return;
  }
  const chosen = events.find(event => event.id === previous) || events[0];
  select.value = chosen.id;
  activeEvent = chosen;
  const cached = getCachedEvent(chosen);
  activeResults = cached.results;
  if (cached.eventInfo) activeEvent.eventInfo = cached.eventInfo;
  $("event-url").value = chosen.url || "";
  updateEventHeading();
}
function updateEventHeading() {
  $("selected-event-title").textContent = activeEvent?.eventInfo?.name || activeEvent?.name || "No event selected";
  const info = activeEvent?.eventInfo;
  const parts = [];
  if (info?.startDate) parts.push(info.startDate);
  if (info?.endDate && info.endDate !== info.startDate) parts.push(info.endDate);
  if (info?.city || info?.stateCode) parts.push([info.city, info.stateCode].filter(Boolean).join(", "));
  $("selected-event-meta").textContent = parts.join(" · ") || (activeResults.length ? `${activeResults.length} player results loaded for this event.` : "Choose an event and import its official standings.");
}
function resultMap() {
  const map = new Map();
  for (const result of activeResults) {
    const id = normId(result.memberId ?? result.usChessId ?? result.uscf_id ?? result.member_id);
    if (id) map.set(id, result);
  }
  return map;
}
function scoreFor(player, results) {
  const id = normId(playerMemberId(player));
  if (!id || player.status === "Out Team") return null;
  return numericScore(results.get(id)?.score);
}
function getTeamStandings() {
  const results = resultMap();
  return teams.map(team => {
    const matched = [];
    for (const player of team.players || []) {
      const score = scoreFor(player, results);
      if (score !== null) matched.push({ score, name: player.name, board: player.board });
    }
    matched.sort((a, b) => b.score - a.score || String(a.name).localeCompare(String(b.name)));
    const top = matched.slice(0, 4);
    return { team, matched, top, total: top.length ? top.reduce((sum, player) => sum + player.score, 0) : null };
  }).sort((a, b) => (b.total ?? -1) - (a.total ?? -1) || a.team.name.localeCompare(b.team.name));
}
function initials(name) { return String(name || "School").split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase(); }
function renderStats() {
  $("school-count").textContent = teams.length;
  $("player-count").textContent = teams.reduce((count, team) => count + (team.players || []).filter(player => player.name?.trim()).length, 0);
  $("event-player-count").textContent = activeResults.length ? activeResults.length : "—";
}
function renderStandings() {
  const standings = getTeamStandings();
  $("standings-body").innerHTML = standings.map((standing, index) => {
    const hasScores = standing.total !== null;
    const rankClass = index === 0 && hasScores ? "rank-badge gold-rank" : "rank-badge";
    const scores = standing.top.length ? standing.top.map(player => formatNumber(player.score)).join(" + ") : "No matched scores";
    return `<tr><td><span class="${rankClass}">${index + 1}</span></td><td><div class="school-cell"><span class="school-monogram">${esc(initials(standing.team.name))}</span><span>${esc(standing.team.name)}</span></div></td><td class="right points-cell ${hasScores ? "" : "pending"}">${hasScores ? formatNumber(standing.total) : "—"}</td><td><span class="match-pill ${standing.matched.length ? "" : "none"}">${standing.matched.length} matched</span></td><td class="right score-list">${esc(scores)}</td></tr>`;
  }).join("") || '<tr><td colspan="5" class="empty-state">Add a school to start the leaderboard.</td></tr>';
}
function statusClass(status) { return status === "Out Team" ? "status-out-team" : status === "Unsure" ? "status-unsure" : "status-in-team"; }
function findPlayer(team, id) { return (team.players || []).find(player => player.id === id); }
function renderTeams() {
  const root = $("teams-container");
  const query = $("school-search").value.trim().toLowerCase();
  const results = resultMap();
  const visibleTeams = teams.filter(team => !query || team.name.toLowerCase().includes(query) || (team.players || []).some(player => String(player.name || "").toLowerCase().includes(query)));
  if (!visibleTeams.length) { root.innerHTML = '<div class="empty-state">No schools or players match that search.</div>'; return; }
  root.innerHTML = visibleTeams.map(team => {
    const players = team.players || [];
    const boards = Array.from({ length: 10 }, (_, index) => `B${index + 1}`);
    const usedBoard = new Set(players.filter(player => player.board !== "Sub").map(player => player.board));
    const usedSubs = players.filter(player => player.board === "Sub").slice().sort((a, b) => String(a.id).localeCompare(String(b.id)));
    const slots = boards.map(board => ({ board, player: players.find(player => player.board === board) || null, defaultStatus: "In Team" }));
    for (let i = 0; i < Math.max(4, usedSubs.length); i++) slots.push({ board: "Sub", player: usedSubs[i] || null, defaultStatus: "Unsure", subIndex: i });
    const populated = players.filter(player => player.name?.trim()).length;
    const rows = slots.map(slot => {
      const player = slot.player;
      const score = player ? scoreFor(player, results) : null;
      const status = player?.status || slot.defaultStatus;
      const name = player?.name || "— Empty slot —";
      const rating = player?.rating !== undefined && player?.rating !== null && player?.rating !== "" ? formatNumber(player.rating) : "—";
      const board = slot.board === "Sub" ? `Sub ${slot.subIndex + 1}` : slot.board;
      const editData = player ? `data-edit-player="${esc(team.id)}" data-player-id="${esc(player.id)}"` : `data-add-slot="${esc(team.id)}" data-board="${esc(slot.board)}" data-default-status="${esc(slot.defaultStatus)}"`;
      return `<tr><td class="board-col">${esc(board)}</td><td class="player-col ${player?.name ? "" : "empty-player"}" title="${esc(name)}">${esc(name)}</td><td class="points-col">${score === null ? "—" : formatNumber(score)}</td><td class="rating-col">${esc(rating)}</td><td><span class="status ${statusClass(status)}">${esc(status)}</span></td><td class="edit-col"><button class="mini-button" ${editData}>${player ? "Edit" : "+ Add"}</button></td></tr>`;
    }).join("");
    return `<article class="team-card"><div class="team-card-header"><div class="team-name-wrap"><span class="team-emblem">${esc(initials(team.name))}</span><div><h3>${esc(team.name)}</h3><span class="team-subtitle">${populated} named ${populated === 1 ? "player" : "players"}</span></div></div><div class="team-actions"><button class="mini-button" data-edit-school="${esc(team.id)}">Edit</button><button class="mini-button delete-school" data-delete-school="${esc(team.id)}" title="Delete school">×</button></div></div><div class="table-scroll"><table class="roster-table"><thead><tr><th>Board</th><th>Player</th><th class="right">Points</th><th class="right">Rating</th><th>Status</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></article>`;
  }).join("");
}
function renderEventsList() {
  const root = $("events-list");
  root.innerHTML = events.map(event => `<article class="event-row"><div><h3>${esc(event.name)}</h3><p>${esc(event.url || "No URL saved")}</p><p>${esc(event.season || "Event")}${event.id === activeEvent?.id ? " · Selected" : ""}</p></div><div class="event-row-actions"><button class="button button-outline" data-select-event="${esc(event.id)}">Select</button><button class="button button-outline" data-edit-event="${esc(event.id)}">Edit URL</button></div></article>`).join("") || '<div class="empty-state">No events yet. Add a US Chess event URL to begin.</div>';
}
function render() { renderEventSelect(); renderStats(); renderStandings(); renderTeams(); renderEventsList(); renderBracket(); }

// Playoff bracket: seeds follow the supplied T-4 standings; win chances use Boards 1–7 averages.
const BRACKET_TEAMS = {
  central: { id: "central", name: "Central", fullName: "Central High School", seed: 1, rating: 1669.2857 },
  northeast: { id: "northeast", name: "Northeast", fullName: "Northeast High School", seed: 2, rating: 1241.8571 },
  masterman: { id: "masterman", name: "Masterman", fullName: "Julia R. Masterman", seed: 3, rating: 1458 },
  gwashington: { id: "gwashington", name: "George Washington", fullName: "George Washington High School", seed: 4, rating: 1074.8571 },
  palumbo: { id: "palumbo", name: "Palumbo", fullName: "Academy at Palumbo", seed: 5, rating: 1232.7143 },
  gwcarver: { id: "gwcarver", name: "G.W. Carver", fullName: "G.W. Carver High School", seed: 6, rating: 981.5714 }
};
const BRACKET_RATING_ORDER = ["central", "northeast", "masterman", "gwashington", "palumbo", "gwcarver"];
let bracketPicks = readLocal(KEYS.bracket, {});
if (!bracketPicks || typeof bracketPicks !== "object" || Array.isArray(bracketPicks)) bracketPicks = {};
function winProbability(teamA, teamB) {
  if (!teamA || !teamB) return null;
  return 1 / (1 + Math.pow(10, (teamB.rating - teamA.rating) / 400));
}
function chanceLabel(team, opponent) {
  if (!team || !opponent) return "";
  return `${Math.round(winProbability(team, opponent) * 1000) / 10}% rating estimate`;
}
function matchupCard({ id, title, left, right, stage, note = "" }) {
  if (!left || !right) return `<div class="bracket-empty">${left ? `${esc(left.name)} awaits the other semifinalist.` : right ? `${esc(right.name)} awaits the other semifinalist.` : "Waiting for the previous round to finish."}</div>`;
  const chosen = bracketPicks[id];
  const leftChance = Math.round(winProbability(left, right) * 1000) / 10;
  const rightChance = Math.round(winProbability(right, left) * 1000) / 10;
  const option = (team, chance) => `<button type="button" class="bracket-team-choice ${chosen === team.id ? "selected" : ""}" data-bracket-match="${id}" data-bracket-winner="${team.id}" aria-pressed="${chosen === team.id}"><span class="seed">${team.seed}</span><span class="bracket-team-name">${esc(team.name)}<span class="bracket-win-chance">${chance}% rating estimate</span></span><span class="choice-check">${chosen === team.id ? "✓" : "·"}</span></button>`;
  return `<article class="bracket-match"><div class="bracket-match-header"><strong>${esc(title)}</strong><span>${esc(stage)}</span></div>${option(left, leftChance)}${option(right, rightChance)}<div class="bracket-match-foot">${chosen ? `<strong>Advances:</strong> ${esc(BRACKET_TEAMS[chosen]?.name || chosen)}` : "Select a team to advance"}${note ? ` · ${esc(note)}` : ""}</div></article>`;
}
function getBracketWinner(matchId) { return BRACKET_TEAMS[bracketPicks[matchId]] || null; }
function renderBracket() {
  const root = $("bracket-container");
  const w1 = getBracketWinner("wildcard-a");
  const w2 = getBracketWinner("wildcard-b");
  const s1 = getBracketWinner("semifinal-a");
  const s2 = getBracketWinner("semifinal-b");
  const finalWinner = getBracketWinner("championship");
  const semifinalA = w1 ? BRACKET_TEAMS.central : BRACKET_TEAMS.central;
  const semifinalB = BRACKET_TEAMS.northeast;
  const rounds = [
    `<section class="bracket-round"><div class="bracket-round-title"><h3>Wildcard round</h3><span>Round 1</span></div>${matchupCard({ id: "wildcard-a", title: "Match 1 · #3 vs #6", left: BRACKET_TEAMS.masterman, right: BRACKET_TEAMS.gwcarver, stage: "Wildcard" })}${matchupCard({ id: "wildcard-b", title: "Match 2 · #4 vs #5", left: BRACKET_TEAMS.gwashington, right: BRACKET_TEAMS.palumbo, stage: "Wildcard" })}<div class="bracket-match-foot">Seeds #1 Central and #2 Northeast receive semifinal byes.</div></section>`,
    `<section class="bracket-round"><div class="bracket-round-title"><h3>Semifinals</h3><span>Round 2</span></div>${matchupCard({ id: "semifinal-a", title: "Semifinal 1", left: semifinalA, right: w1, stage: "Central's side" })}${matchupCard({ id: "semifinal-b", title: "Semifinal 2", left: semifinalB, right: w2, stage: "Northeast's side" })}</section>`,
    `<section class="bracket-round"><div class="bracket-round-title"><h3>Championship</h3><span>Final</span></div>${matchupCard({ id: "championship", title: "Championship match", left: s1, right: s2, stage: "Final" })}<div class="bracket-match-foot">The semifinal winners meet for the title.</div></section>`,
    `<section class="bracket-round final-round"><div class="bracket-round-title"><h3>Champion</h3><span>Winner</span></div>${finalWinner ? `<div class="bracket-champion"><div class="trophy">♛</div><small>Predicted champion</small><strong>${esc(finalWinner.fullName)}</strong><p>Change any earlier pick to explore another path.</p></div>` : `<div class="bracket-empty">Choose the championship winner to reveal your predicted champion.</div>`}<div class="bracket-match-foot">Picks are saved in this browser.</div></section>`
  ];
  root.innerHTML = rounds.join("");
  $("bracket-ratings").innerHTML = BRACKET_RATING_ORDER.map(id => { const team = BRACKET_TEAMS[id]; return `<div class="rating-item"><span><span class="rating-seed">#${team.seed}</span> ${esc(team.name)}</span><strong>${Math.round(team.rating).toLocaleString()}</strong></div>`; }).join("");
}
function chooseBracketWinner(matchId, teamId) {
  if (!BRACKET_TEAMS[teamId]) return;
  const matchTeams = {
    "wildcard-a": ["masterman", "gwcarver"],
    "wildcard-b": ["gwashington", "palumbo"],
    "semifinal-a": ["central", bracketPicks["wildcard-a"]],
    "semifinal-b": ["northeast", bracketPicks["wildcard-b"]],
    "championship": [bracketPicks["semifinal-a"], bracketPicks["semifinal-b"]]
  };
  if (!(matchTeams[matchId] || []).includes(teamId)) return;
  bracketPicks[matchId] = teamId;
  const clear = matchId === "wildcard-a" ? ["semifinal-a", "championship"]
    : matchId === "wildcard-b" ? ["semifinal-b", "championship"]
    : matchId === "semifinal-a" || matchId === "semifinal-b" ? ["championship"] : [];
  clear.forEach(key => delete bracketPicks[key]);
  localStorage.setItem(KEYS.bracket, JSON.stringify(bracketPicks));
  renderBracket();
}

async function testConnection(showMessage = true) {
  const api = getApiBase();
  try {
    const response = await fetch(`${api}/api/health`, { headers: { Accept: "application/json" } });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || `API returned ${response.status}`);
    setConnection("online", "API connected");
    if (showMessage) setStatus(`Connected to the Worker. KV storage: ${data.rosterStorage ? "ready" : "not configured"}; admin token: ${data.adminConfigured ? "configured" : "missing"}.`, data.rosterStorage ? "success" : "error");
    return data;
  } catch (error) {
    setConnection("offline", "API unavailable");
    if (showMessage) setStatus(`Could not connect to the Worker: ${error.message}`, "error");
    throw error;
  }
}
async function loadSharedRoster() {
  const api = getApiBase();
  try {
    await testConnection(false);
    const response = await fetch(`${api}/api/roster`, { headers: { Accept: "application/json" } });
    const data = await response.json();
    if (!response.ok || data.ok !== true || !Array.isArray(data.teams)) throw new Error(data.error || `Roster API returned ${response.status}`);
    const isTemporaryTestRoster = data.teams.length === 1 &&
      data.teams[0]?.id === "test-school" &&
      (data.teams[0]?.players || []).some(player => player.name === "Example Player");
    if (data.teams.length && !isTemporaryTestRoster) {
      teams = data.teams.map(normalizeTeam);
      loadedSharedRoster = true;
      markSaved(data.updatedAt ? `Shared roster loaded · ${new Date(data.updatedAt).toLocaleString()}` : "Shared roster loaded");
      setStatus("Shared roster loaded from Cloudflare. Roster edits are visible to everyone after you save them.", "success");
    } else {
      teams = clone(STARTER_TEAMS);
      loadedSharedRoster = false;
      markDirty();
      setStatus(isTemporaryTestRoster
        ? "The temporary Test High School entry was detected. Your spreadsheet-based 12-school roster is shown instead; enter your admin token and save it to replace the test entry."
        : "Cloudflare storage is connected, but no teams have been published yet. The spreadsheet-based starter roster is shown; enter your admin token and save it to publish.");
    }
  } catch (error) {
    teams = clone(STARTER_TEAMS);
    loadedSharedRoster = false;
    markDirty();
    setStatus(`Showing the starter roster because shared storage could not be loaded: ${error.message}`, "error");
  }
  render();
}
function normalizeTeam(team) {
  return { ...team, id: String(team.id || newId("school")), name: String(team.name || "Unnamed school"), players: Array.isArray(team.players) ? team.players.map((player, index) => ({ ...player, id: String(player.id || newId(`player${index}`)), board: player.board || "B1", name: String(player.name || ""), memberId: String(playerMemberId(player) || ""), rating: player.rating ?? "", status: player.status || (player.board === "Sub" ? "Unsure" : "In Team") })) : [] };
}
async function saveSharedRoster() {
  const token = $("admin-token").value;
  if (!token) { setStatus("Enter your ADMIN_TOKEN in Events & settings before saving the shared roster.", "error"); document.querySelector('[data-tab="events"]').click(); $("admin-token").focus(); return; }
  const button = $("save-roster-btn");
  button.disabled = true; button.textContent = "Saving…";
  try {
    const response = await fetch(`${getApiBase()}/api/roster`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, Accept: "application/json" }, body: JSON.stringify({ teams: teams.map(team => ({ ...team, players: (team.players || []).filter(player => String(player.name || "").trim()).map(player => ({ ...player, memberId: String(playerMemberId(player) || "") })) })) }) });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || `Save failed (${response.status})`);
    teams = teams.map(normalizeTeam);
    loadedSharedRoster = true;
    markSaved(`Saved for everyone · ${new Date(data.updatedAt).toLocaleTimeString()}`);
    setStatus(`Shared roster saved successfully. ${data.teamCount} schools are now stored in Cloudflare KV.`, "success");
    render();
  } catch (error) {
    setStatus(`Could not save the shared roster: ${error.message}`, "error");
    if (/Unauthorized/i.test(error.message)) { document.querySelector('[data-tab="events"]').click(); $("admin-token").focus(); }
  } finally { button.disabled = false; button.textContent = "Save shared roster"; }
}
async function importEventResults() {
  if (!activeEvent) { setStatus("Add an event before importing results.", "error"); return; }
  const eventUrl = $("event-url").value.trim();
  if (!validEventUrl(eventUrl)) { setStatus("Use a valid official URL like https://ratings.uschess.org/event/202602240493.", "error"); return; }
  activeEvent.url = eventUrl; saveEvents();
  const button = $("fetch-event-btn"); button.disabled = true; button.innerHTML = "Importing…";
  setStatus("Fetching official US Chess event details and section standings…");
  try {
    const response = await fetch(`${getApiBase()}/api/event?url=${encodeURIComponent(eventUrl)}`, { headers: { Accept: "application/json" } });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || `Import failed (${response.status})`);
    if (!Array.isArray(data.results)) throw new Error("The API response did not contain a results array. Confirm that the latest Worker code is deployed.");
    activeResults = data.results;
    activeEvent.eventInfo = data.event || null;
    activeEvent.name = data.event?.name || activeEvent.name;
    cacheActiveEvent(); saveEvents();
    render();
    const sections = (data.sections || []).map(section => `${section.name}: ${section.playerCount}`).join(" · ");
    setStatus(`Imported ${data.playerCount ?? activeResults.length} player results${sections ? ` (${sections})` : ""}. Add US Chess IDs to roster entries to calculate team scores.`, "success");
  } catch (error) {
    setStatus(`Could not import event results: ${error.message}`, "error");
  } finally { button.disabled = false; button.innerHTML = "<span>↓</span> Import results"; }
}
function saveEventUrl() {
  if (!activeEvent) { setStatus("Add an event first.", "error"); return; }
  const url = $("event-url").value.trim();
  if (!validEventUrl(url)) { setStatus("Enter a valid official US Chess event URL.", "error"); return; }
  activeEvent.url = url; saveEvents(); renderEventSelect(); renderEventsList(); setStatus("Event link saved in this browser. Import results when ready.", "success");
}
function openSchoolDialog(team = null) {
  $("school-dialog-title").textContent = team ? "Edit school" : "Add school";
  $("school-id").value = team?.id || ""; $("school-name").value = team?.name || ""; $("school-dialog").showModal();
}
function openPlayerDialog(teamId, player = null, board = "B1", defaultStatus = "In Team") {
  $("player-dialog-title").textContent = player ? "Edit player" : `Add ${board === "Sub" ? "substitute" : board}`;
  $("player-team-id").value = teamId; $("player-id").value = player?.id || ""; $("player-board").value = player?.board || board; $("player-name").value = player?.name || ""; $("player-member-id").value = player ? playerMemberId(player) : ""; $("player-rating").value = player?.rating ?? ""; $("player-status").value = player?.status || defaultStatus;
  $("delete-player-btn").hidden = !player; $("player-dialog").showModal();
}
function addEvent() {
  const name = prompt("Event name (for example, ASAP PSCL Round 1):");
  if (!name?.trim()) return;
  const url = prompt("Paste the official US Chess event URL:");
  if (!url || !validEventUrl(url.trim())) { alert("Please enter a valid https://ratings.uschess.org/event/... URL."); return; }
  const event = { id: newId("event"), name: name.trim(), url: url.trim(), season: "2026-2027" };
  events.push(event); saveEvents(); activeEvent = event; activeResults = []; render(); $("event-select").value = event.id; $("event-url").value = event.url; setStatus("Event added to this browser. Import its results when they are available.");
}
function exportRoster() {
  const data = JSON.stringify({ exportedAt: new Date().toISOString(), teams }, null, 2);
  const blob = new Blob([data], { type: "application/json" }); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "asap-pscl-roster-backup.json"; anchor.click(); URL.revokeObjectURL(url);
}

// Navigation between the three dashboard sections.
document.querySelectorAll("[data-tab]").forEach(button => button.addEventListener("click", () => {
  document.querySelectorAll("[data-tab]").forEach(item => item.classList.toggle("active", item === button));
  document.querySelectorAll(".tab-panel").forEach(panel => panel.classList.toggle("active", panel.id === `tab-${button.dataset.tab}`));
}));

$("event-select").addEventListener("change", () => {
  activeEvent = events.find(event => event.id === $("event-select").value) || null;
  const cached = activeEvent ? getCachedEvent(activeEvent) : { results: [], eventInfo: null };
  activeResults = cached.results; if (activeEvent && cached.eventInfo) activeEvent.eventInfo = cached.eventInfo;
  $("event-url").value = activeEvent?.url || ""; renderStats(); renderStandings(); renderTeams(); updateEventHeading();
  setStatus(activeResults.length ? `Loaded ${activeResults.length} cached results for this event.` : "No cached results for this event yet.");
});
$("save-event-btn").addEventListener("click", saveEventUrl);
$("fetch-event-btn").addEventListener("click", importEventResults);
$("refresh-standings-btn").addEventListener("click", () => { renderStandings(); setStatus("Team standings recalculated for the selected event.", "success"); });
$("add-event-btn").addEventListener("click", addEvent);
$("add-school-btn").addEventListener("click", () => openSchoolDialog());
$("save-roster-btn").addEventListener("click", saveSharedRoster);
$("school-search").addEventListener("input", renderTeams);
$("save-api-btn").addEventListener("click", async () => {
  const api = getApiBase();
  if (!/^https:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(api)) { setStatus("Enter the Worker base HTTPS URL without a path.", "error"); return; }
  localStorage.setItem(KEYS.api, api); await loadSharedRoster();
});
$("test-api-btn").addEventListener("click", () => testConnection(true).catch(() => {}));
$("export-btn").addEventListener("click", exportRoster);
$("import-file").addEventListener("change", async event => {
  const file = event.target.files?.[0]; if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (!Array.isArray(data.teams)) throw new Error("Backup must contain a teams array.");
    teams = data.teams.map(normalizeTeam); markDirty(); render();
    setStatus("Roster backup loaded into this page. Click Save shared roster to publish it to everyone.", "success");
  } catch (error) { setStatus(`Could not import roster backup: ${error.message}`, "error"); }
  event.target.value = "";
});
$("school-form").addEventListener("submit", event => {
  if (event.submitter?.value === "cancel") return;
  event.preventDefault();
  const id = $("school-id").value; const name = $("school-name").value.trim(); if (!name) return;
  if (id) { const team = teams.find(item => item.id === id); if (team) team.name = name; }
  else teams.push({ id: newId("school"), name, players: [] });
  markDirty(); $("school-dialog").close(); render();
});
$("player-form").addEventListener("submit", event => {
  if (event.submitter?.value === "cancel") return;
  event.preventDefault();
  const team = teams.find(item => item.id === $("player-team-id").value); if (!team) return;
  const id = $("player-id").value; const name = $("player-name").value.trim();
  const existingIndex = (team.players || []).findIndex(player => player.id === id);
  if (!name) {
    if (existingIndex >= 0) team.players.splice(existingIndex, 1);
    else { setStatus("Enter a player name to add a roster entry.", "error"); return; }
  } else {
    const player = { id: id || newId("player"), board: $("player-board").value, name, memberId: normId($("player-member-id").value), rating: $("player-rating").value === "" ? "" : Number($("player-rating").value), status: $("player-status").value };
    team.players ||= [];
    if (existingIndex >= 0) team.players[existingIndex] = player; else team.players.push(player);
  }
  markDirty(); $("player-dialog").close(); render();
});
$("delete-player-btn").addEventListener("click", () => {
  const team = teams.find(item => item.id === $("player-team-id").value); const id = $("player-id").value;
  if (team && id && confirm("Remove this player from the roster?")) { team.players = (team.players || []).filter(player => player.id !== id); markDirty(); $("player-dialog").close(); render(); }
});
$("teams-container").addEventListener("click", event => {
  const editPlayer = event.target.closest("[data-edit-player]");
  const addSlot = event.target.closest("[data-add-slot]");
  const editSchool = event.target.closest("[data-edit-school]");
  const deleteSchool = event.target.closest("[data-delete-school]");
  if (editPlayer) { const team = teams.find(item => item.id === editPlayer.dataset.editPlayer); const player = team && findPlayer(team, editPlayer.dataset.playerId); if (team && player) openPlayerDialog(team.id, player); }
  else if (addSlot) openPlayerDialog(addSlot.dataset.addSlot, null, addSlot.dataset.board, addSlot.dataset.defaultStatus);
  else if (editSchool) { const team = teams.find(item => item.id === editSchool.dataset.editSchool); if (team) openSchoolDialog(team); }
  else if (deleteSchool) { const team = teams.find(item => item.id === deleteSchool.dataset.deleteSchool); if (team && confirm(`Delete ${team.name} and its roster entries? Save the shared roster afterward to publish this change.`)) { teams = teams.filter(item => item.id !== team.id); markDirty(); render(); } }
});
$("events-list").addEventListener("click", event => {
  const selectButton = event.target.closest("[data-select-event]"); const editButton = event.target.closest("[data-edit-event]");
  if (selectButton) { $("event-select").value = selectButton.dataset.selectEvent; $("event-select").dispatchEvent(new Event("change")); document.querySelector('[data-tab="overview"]').click(); }
  if (editButton) { const selected = events.find(item => item.id === editButton.dataset.editEvent); if (!selected) return; const nextUrl = prompt("Edit the official US Chess event URL:", selected.url || ""); if (nextUrl === null) return; if (!validEventUrl(nextUrl.trim())) { alert("Enter a valid official US Chess event URL."); return; } selected.url = nextUrl.trim(); selected.eventInfo = null; saveEvents(); renderEventSelect(); renderEventsList(); setStatus("Event URL updated in this browser. Import results again to refresh its standings.", "success"); }
});

$("bracket-container").addEventListener("click", event => {
  const choice = event.target.closest("[data-bracket-match]");
  if (choice) chooseBracketWinner(choice.dataset.bracketMatch, choice.dataset.bracketWinner);
});
$("reset-bracket-btn").addEventListener("click", () => {
  if (!Object.keys(bracketPicks).length || confirm("Clear all playoff bracket picks?")) {
    bracketPicks = {};
    localStorage.removeItem(KEYS.bracket);
    renderBracket();
  }
});

const savedApi = localStorage.getItem(KEYS.api);
$("api-base").value = savedApi || API_DEFAULT;
render();
loadSharedRoster();
