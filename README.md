# ASAP PSCL Team Leaderboard

A simple static GitHub Pages website plus a Cloudflare Worker that attempts to fetch and parse US Chess event crosstables. Each event has independent standings; event scores are never combined across events.

## Features
- Add/edit schools and players in the website
- Board slots B1–B10 and substitutes; statuses In Team, Unsure, Out Team
- Add/change individual event URLs
- Fetch event data through a small server-side Worker
- Match results by US Chess ID, not name alone
- T-4 Points = sum of the four highest matched roster-player scores in the selected event
- Export/import roster and event configuration JSON
- Cache results separately for each event in the current browser

## Important limitations
1. This is a starter implementation. The public US Chess page may load its crosstable with JavaScript or change its HTML. The included parser handles ordinary HTML tables only and may need adapting. If it cannot find rows, check the event page's authorized data source/export; it does not bypass access controls.
2. Roster edits are saved in the current browser only, not shared with every visitor. Use Export roster to back up your data. Shared editing would require a database and authenticated write access.
3. GitHub Pages hosts the frontend; it does not run the API. The small API is in `worker/`.
4. Each event is independent. There is no cumulative season leaderboard.
5. The included starter event is the 2025–2026 ASAP PSCL event `https://ratings.uschess.org/event/202602240493` for testing only, not a 2026–2027 event.
6. Event results may not contain school/board membership. Assign players to rosters manually.
7. T-4 standings are sorted by total, then school name. Ties are not assigned shared competition ranks. Confirm the league's official tie-breaking rules.
8. Check US Chess access and data reuse terms before using automated fetching publicly.

## Deploy the API (Cloudflare Workers)
1. Install Node.js.
2. From the repository root run:
   ```bash
   cd worker
   npm install wrangler
   npx wrangler login
   npx wrangler deploy
   ```
3. Copy the deployed `https://...workers.dev` URL.
4. On the website, open **API connection settings**, paste the Worker URL, and save it.
5. Select the 2025–2026 test event and click **Fetch results**.

Cloudflare's free tier has usage limits; check current terms before relying on it for sustained use.

## Deploy the website (GitHub Pages)
1. Create a public GitHub repository, e.g. `asap-pscl`.
2. Upload `index.html`, `style.css`, `app.js`, `README.md`, `package.json`, `.gitignore`, `data/`, and `worker/`.
3. Go to **Settings → Pages** in the repository.
4. Choose **Deploy from a branch**, branch `main`, folder `/ (root)`, and save.
5. Open the published Pages URL and configure the Worker URL as above.

No frontend build step is required.

## How to use it
- Add schools and players with the website's buttons.
- Enter US Chess IDs whenever possible; the importer uses these to match results.
- Add each PSCL event separately with **Add event**.
- Select one event and fetch its results. The selected event alone drives the standings.
- Export roster regularly. Import replaces the current browser's roster/events with the backup.

## Scoring
- Players marked `Out Team` do not count.
- Only players with a matching US Chess ID and numeric score in the selected event count.
- T-4 is the sum of up to four highest qualifying scores. If fewer than four scores match, the available scores are summed.
- Missing scores are not treated as zero.
- This starter does not calculate a separate Team Points value because its exact formula was not provided.

## API endpoints
- `GET /api/health`
- `GET /api/event?url=https%3A%2F%2Fratings.uschess.org%2Fevent%2F202602240493`

The Worker only accepts `https://ratings.uschess.org/event/...` URLs.
