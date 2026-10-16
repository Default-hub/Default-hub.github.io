# ASAP PSCL Chess League Dashboard

A static, responsive GitHub Pages site for the Philadelphia scholastic chess league. The interface is based on the spreadsheet structure shared by the league: 12 schools, board slots B1–B10, substitute slots, player, points, rating, and roster status.

## Included

- Clean dashboard with Overview, School Rosters, and Events & Settings tabs.
- School roster cards with B1–B10 and four substitute slots.
- Roster fields: player name, US Chess membership ID, rating, and status (`In Team`, `Unsure`, `Out Team`).
- Shared roster read/write through the deployed Cloudflare Worker and KV namespace.
- Admin token entered in the browser UI only; it is not stored in local storage or included in public files.
- US Chess event importer using the Worker endpoint.
- Event-by-event T-4 standings: each school's four highest eligible matched scores are added for the selected event only.
- Interactive six-team playoff prediction bracket with rating-based win estimates; choose winners and automatically advance them through semifinals and the championship. Picks persist in the current browser and can be reset.
- Export/import JSON roster backups.
- Mobile-friendly responsive layout.

## Prediction bracket

The bracket uses the supplied T-4 seed order: #1 Central and #2 Northeast receive semifinal byes; #3 Masterman plays #6 G.W. Carver; #4 George Washington plays #5 Palumbo. The winner of each wildcard matchup advances to face one of the top two seeds. Semifinal winners meet in the championship.

Estimated win chances use the average official ratings for Boards 1–7 from the pre-playoff spreadsheet and the Elo expected-score formula. These are illustrative rating-based estimates, not calibrated match odds or official league predictions. Bracket picks are stored in that browser only; they are not synced to Cloudflare KV.

## Important notes

- The starter roster includes the 12 schools from the supplied spreadsheet. It pre-fills the Academy at Palumbo entries visible in the spreadsheet: Brandon Tran (1671), Bryan Martinez-Hernandez (1473), Mabinti Mansaray (1338), Nina Yang (1122), Johnfer Quispe (1128), and substitute Faadi Garcia (1587, Out Team). US Chess membership IDs were not present in the supplied text, so those fields are blank and must be entered before the scores can match.
- Blank board and substitute slots are visual placeholders, not saved player records. Only named players are sent to the Worker.
- The exact spreadsheet formula for “Team Points” was not provided. This site calculates T-4 points only and does not invent a separate Team Points formula.
- The spreadsheet contained `#NUM!` in T-4 cells. This implementation avoids that by showing an em dash until at least one eligible roster player matches an imported result.
- The event list and imported result cache are currently saved in each browser. The roster itself is shared via Cloudflare KV. Each event has independent standings; scores are not accumulated across events.
- Only players with a matching US Chess membership ID are scored. Names alone are not used for matching.
- Confirm the league's official scoring and tie-breaking rules before treating this unofficial tool's standings as final.

## Publish on GitHub Pages

1. Download and unzip this project.
2. Create or open your GitHub repository for the website.
3. Upload `index.html`, `style.css`, `app.js`, the `data` folder, and this README to the repository root.
4. In the repository, open **Settings → Pages**.
5. Choose **Deploy from a branch**, select `main` and `/(root)`, and save.
6. Open the published Pages site.

No build step is required.

## Cloudflare connection

This frontend defaults to the existing Worker URL:

`https://asap-pscl-api.juggernog193.workers.dev`

The Worker must have the `ROSTER_KV` namespace binding and `ADMIN_TOKEN` secret already configured, and must implement:

- `GET /api/health`
- `GET /api/roster`
- `PUT /api/roster` (requires `Authorization: Bearer <ADMIN_TOKEN>`)
- `GET /api/event?url=<official US Chess event URL>`

In the site's **Events & settings** tab:

1. Click **Test connection** to verify the Worker.
2. Enter the `ADMIN_TOKEN` secret only when you need to publish roster edits.
3. Add/edit roster entries, then click **Save shared roster**.
4. After a successful save, other visitors can load the same roster. Clear the token field when you're done editing.

Do not put the admin token into `index.html`, `app.js`, GitHub repository settings for public files, or this README.

## Test event

The initial event is the 2025–2026 ASAP PSCL event:

`https://ratings.uschess.org/event/202602240493`

The Worker previously returned 269 player records across sections HS (121), MS (85), and ES (63). Use this event to verify the importer before adding 2026–2027 events.
