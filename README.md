# ASAP PSCL — Universal ChessRoster CSV Reports

A static, browser-only PSCL report tool. Upload ChessRoster CSV exports without an API, Cloudflare Worker, server, or account. The importer detects available columns, preserves the original report, and enables normalized features only when the required data exists.

## Use it
1. Open `index.html` or publish this folder using GitHub Pages.
2. Select or create an event.
3. Export a report from ChessRoster as CSV and upload it.
4. Review the detected report type, normalized player/team views when possible, and the full source-data preview.

## Supported input
- Player standings and round-by-round results
- Player rosters and individual reports
- Team reports with team names/scores
- Other tabular ChessRoster CSV exports, including reports with unknown columns
- Comma-, semicolon-, and tab-delimited text files saved with a CSV extension
- Variable column order, optional columns, extra fields, quoted names with commas, and blank cells

The importer uses flexible header matching for names, IDs, ratings, teams, totals, places, rounds, and tiebreaks. Unknown fields remain available in the source-data preview and the exported source CSV. If a report does not contain team membership, players remain unassigned rather than being placed on invented teams. Team playoff predictions need enough team data and rating information to be meaningful.

## Features
- Light and dark themes, saved locally
- Event manager with browser-local persistence
- Flexible CSV parsing and report-type detection
- Team standings from player reports that include team membership
- Player reports with available ratings, IDs, totals, and rounds
- Full source report preview and export, preserving the imported columns and order
- Six-team bracket and rough rating estimates when compatible team/player data is available
- CSV exports and JSON backup/restore

## Data and privacy
CSV parsing and calculations happen in the browser. Reports are saved in this browser's `localStorage`; they are not automatically shared with other devices or users. Use **Download backup** to keep a copy. No report is sent to an API or external server. The app uses system fonts and does not need internet access to import or display reports.

## Calculation notes
- `Total`, `Score`, `Points`, or `Pts` are treated as the event score when recognized.
- T-4 is calculated only from player rows with team membership, as the sum of each team's four highest numeric scores.
- Average team rating uses up to the seven highest available player ratings when player data is present.
- Rating-based win chances are estimates, not official odds. They should not be shown as authoritative if the CSV's team membership, eligibility, or ratings are incomplete.
- This tool cannot infer teams, missing rounds, or official league eligibility from a report that does not contain those facts.
