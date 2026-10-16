# ASAP PSCL Chess League Dashboard

A static, responsive GitHub Pages website plus a Cloudflare Worker API for the Philadelphia scholastic chess league. The website keeps event results separate, calculates each school's T-4 score from matched roster players, and includes the six-team playoff prediction bracket.

## What is connected

- **Frontend:** `index.html`, `style.css`, and `app.js` work together without a build step.
- **Shared roster:** `GET /api/roster` and authenticated `PUT /api/roster` use Cloudflare KV.
- **Worker health:** `GET /api/health` reports whether the KV binding and admin secret are configured (it never returns the secret).
- **US Chess events:** `GET /api/event?url=...` requests event/section standings from the US Chess ratings API and normalizes results for the dashboard.
- **ChessRoster events:** paste a supported ChessRoster tournament/report URL into the event URL field. Download that report's standings as CSV from ChessRoster, then use **Upload ChessRoster CSV**. The Worker parses the CSV and the dashboard stores the imported results for that event.
- **Event-specific scoring:** results are cached separately in the current browser for each event; scores do not carry across events.
- **T-4:** each school gets the sum of its four highest scores among roster players matched by US Chess membership ID. `Out Team` players do not count. If a school has zero ID matches, the leaderboard falls back to recognized ChessRoster team codes for a provisional score; verify those codes and eligibility before treating it as official.
- **Playoff bracket:** the six-team wildcard/semi-final/championship bracket is interactive; changing an earlier winner clears dependent picks. Picks persist in that browser.
- **Roster backups:** export/import JSON backups from Events & settings.

## Important scoring and data notes

- Roster matching is by US Chess membership ID, not player name. Enter IDs in School rosters to connect event results to the right school.
- ChessRoster CSV rows include a `Team` code, but the dashboard uses your PSCL roster and matching US Chess IDs for its school scores. This prevents a tournament's team label from being silently treated as a PSCL school.
- The CSV parser expects standings columns such as `Name`, `ID`, `Team`, and `Total`. If your export uses different headings, the import will show an error instead of pretending it succeeded.
- ChessRoster's report endpoint is used to validate a report link and construct an embed URL; it does **not** magically retrieve the standings data. Download and upload the CSV.
- The Worker computes a diagnostic T-4 table by the CSV `Team` code in its API response, but the website's leaderboard is calculated from its roster. These are distinct on purpose.
- The bracket's rating estimates use the pre-playoff Board 1–7 average ratings in `app.js`. They are illustrative estimates, not official match odds.
- Confirm official league scoring/tie-break rules before relying on the dashboard as an official standings source.

## Publish the website on GitHub Pages

1. Download and unzip this package.
2. Upload the **contents** of the `asap-pscl-leaderboard` folder to the root of the repository serving your GitHub Pages site: `index.html`, `app.js`, `style.css`, `data/`, `worker/`, and this README.
3. In GitHub, open **Settings → Pages** and confirm Pages deploys from your intended branch and root folder.
4. Wait for the deployment, then hard-refresh the site (`Ctrl+Shift+R`).

No frontend build or npm install is required.

## Connect Cloudflare Worker

The frontend defaults to:

`https://asap-pscl-api.juggernog193.workers.dev`

The included Worker source is in `worker/index.js`. It keeps the same endpoint paths the frontend calls and adds the ChessRoster CSV endpoint.

**Before updating your deployed Worker:**

1. Open the existing `asap-pscl-api` Worker in Cloudflare and save a copy of its current code.
2. Replace its code with `worker/index.js` and deploy it.
3. Verify the existing KV binding is still named `ROSTER_KV` and still points to your existing roster namespace.
4. Verify `ADMIN_TOKEN` remains configured as a Worker secret. Do not put its value in the repository or send it in chat.
5. Test `https://asap-pscl-api.juggernog193.workers.dev/api/health` and confirm `ok`, `rosterStorage`, and `adminConfigured` are true.

If you deploy using Wrangler instead of the Cloudflare dashboard, add the existing KV namespace ID under `[[kv_namespaces]]` in `worker/wrangler.toml`; do not guess or create a new ID. Keep the existing namespace to preserve the shared roster.

## How to use it

1. Open the website and go to **Events & settings**.
2. Click **Test connection**. The connection indicator should report that the API is connected.
3. The site loads the shared roster from KV. To publish roster changes, enter the `ADMIN_TOKEN` in the page's password field and click **Save shared roster**. The token is only held in page memory and is not saved to local storage.
4. On Overview, select an event or click **Add event**. Add either a valid US Chess event URL (`https://ratings.uschess.org/event/...`) or ChessRoster tournament/report URL (`https://www.chessroster.com/tournaments/.../reports?...`).
5. For a US Chess event, click **Import results**. For ChessRoster, download the standings CSV from the report and click **Upload ChessRoster CSV**.
6. Add each player's US Chess ID to the correct school roster entry. The leaderboard and individual roster rows will update for the selected event.
7. Switch events to see their independent results. Use the Prediction bracket tab to choose winners and advance through the rounds.

## Test checklist

- `/api/health` returns JSON with `ok: true`.
- `/api/roster` returns JSON and an array `teams` (empty is valid if you have not published a roster yet).
- Pasting a ChessRoster link and saving it reveals the CSV upload control.
- A valid CSV import reports its player count and changes the selected event's imported player count.
- Selecting a different event shows that event's own cached results, not a combined season total.
- Bracket picks advance and changing an earlier pick clears later dependent picks.
- Refreshing the page preserves local event results and bracket picks.

## Data persistence

- **Shared:** roster stored in Cloudflare KV.
- **Per-browser:** event list, imported event results, and bracket picks are stored in `localStorage`. They are not currently synchronized between different visitors' browsers.
