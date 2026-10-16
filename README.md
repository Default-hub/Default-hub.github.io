# ASAP PSCL CSV Reports

A static, browser-only website for generating team standings and player reports from ChessRoster standings CSV files. There is no API, Cloudflare Worker, server-side import, or account required.

## Use it

1. Open `index.html` in a browser or publish the folder using GitHub Pages.
2. Select the event, or create a new event under **Events & reports**.
3. Download the event's standings report from ChessRoster as a CSV.
4. Choose **Upload standings CSV** and select the file.
5. The site detects the `Team` and `Name` fields, groups players by the CSV team code, and updates standings and player reports.

Uploading another CSV to the same event replaces that event's previous results. Different events are kept separately.

## Features

- Automatic detection of all team codes and players present in the uploaded CSV.
- Team leaderboard using the sum of each team's four highest numeric values in the `Total` column (T-4).
- Player report with ratings, IDs, totals, and round-by-round results when available.
- CSV exports for team standings and player reports.
- Six-team prediction bracket generated from the six highest T-4 teams in the current report. Rating estimates use each team's seven highest available player ratings.
- Local event storage and JSON backup/restore.
- Rating display uses no thousands separators.

## Data and privacy

All CSV parsing and calculations happen in the browser. The website does not send the CSV to an API or external server. Events are saved in that browser's `localStorage`; they are not automatically shared across devices or with other users. Use **Download backup** to keep a copy.

## CSV requirements

The importer expects a header row containing at least `Name` and `Team`. It recognizes common variants of `Place`, `ID`, `Rtng`/`Rating`, and `Total`. Columns named `Rd 1`, `Rd 2`, etc. are shown as round results. Unknown team codes are retained and displayed as their code, so the report—not a hardcoded roster—determines which teams appear.

## Notes

- `Total` is the event score; `Rtng` is the player's rating. They are not interchangeable.
- T-4 scores are based only on players present in the imported report. They are not official PSCL results unless the report and eligibility rules match the league's rules.
- Rating-based playoff probabilities are rough estimates, not official odds.
