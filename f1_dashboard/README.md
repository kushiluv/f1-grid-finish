# Grid / Finish

An interactive F1 research presentation for **BAIT 518 · Group 3 · BA2**.

**How strongly is starting grid position associated with race outcomes in Formula 1?**

## Open the dashboard

Double-click **Start Dashboard.command** in Finder. Keep its Terminal window open while using the app. The supplied production build works offline; Python 3 is required, and Node is not needed to run it.

Alternatively:

```sh
cd "/Users/kushiluvjangu/work/Data visualisation/f1_dashboard"
python3 scripts/serve.py
```

The launcher opens a local browser URL, normally http://127.0.0.1:5180/. It binds only to this computer and chooses another nearby port if needed. Control+C stops it. Use the launcher rather than opening `dist/index.html` directly.

## The revised six-minute presentation

The root page opens with a short explanation of qualifying, the starting grid, and the finishing position. Ask the audience to estimate how often the first starter wins, choose an estimate, and **Reveal the history**. **Skip to the evidence** is also available.

The four analytical chapters then tell a connected story:

1. **The pattern:** a large start–finish heatmap, correlation, and visible starting-place shortcuts. A cell click explains its records inline; **View the records** opens the table separately.
2. **The circuit:** begin with whole-field correlation, then **Show wins from first** to reveal the second aligned comparison. Highlight a circuit to select its row in both panels.
3. **The goal:** change **Top ten → Win** with the same groups, denominator, and 0–100% scale. **What about farther back?** reveals the one win from 1,185 starts in P16–22. **Follow that race** opens its actual record's case study.
4. **The race:** follow São Paulo 2024 at the grid, lap 11, restart order at lap 33, lap 43, and the finish. Future observations and result labels remain hidden until revealed. **Show full race**, the checkpoint buttons, and the scrubber provide direct access.

The final screen connects the findings to a historical race preview: **A head start, not a verdict.**

Use the footer action or left/right arrows outside controls to move through presentation steps. Back reverses the reveal sequence. A chapter tab starts that chapter's initial beat. All modes and partial presentation steps have reproducible URLs. **Replay introduction** is available from the analytical screens.

See `public/STORY_SCRIPT.md` or open **Speaker notes** for the six-minute route. Every team member should contribute. Allow pauses for the audience's estimate and the chart reveals.

## Explore and inspect

**Explore** shows the full evidence and exposes year ranges, circuit selection, driver/team cohorts, and Belgium 2021 sensitivity. Driver highlighting is separate from filtering and leaves reference rates unchanged. Returning to **Present** loads the chosen chapter's fixed preset and resets Explore filters.

The São Paulo case is explicitly pinned to that race, even when other chapter filters differ. Explore can add Gasly and inspect the full lap chart. A partial presentation PNG includes its checkpoint in the filename and attribution. **Show full race** before exporting if the complete case is wanted. The circuit's partial PNG is similarly labeled as the field-only comparison.

**Data** opens the underlying driver–race records and CSV export. **Sources & methods** provides definitions, denominator rules, uncertainty, AI acknowledgment, and all 35 source-grid review decisions. Keyboard controls, text summaries, and the data table complement chart interaction. Reduced-motion settings preserve the same evidence without reveal animation.

## Data and analysis

The primary frozen source is **F1DB v2025.24.0**, with seven documented grid/status corrections, covering 2014–2025 Grands Prix. Sprint results and Belgium 2021 are excluded by default.

Default checked reference values:

- 251 races; 4,920 numeric-grid starts; 4,117 eligible finishers.
- Pearson r = 0.7646446838008164; 713 / 4,117 finishers kept exactly their starting place.
- Actual P1 starts that won: 134 / 250 = 53.6%.
- P11–15: 402 / 1,238 top-ten finishes; 2 / 1,238 wins.
- P16–22: 1 / 1,185 wins, the Verstappen São Paulo 2024 P17 start.

Correlation uses finishers. Outcome rates include eligible starts that ended in retirement/disqualification. Pit-lane starts are separately inspectable. Historical group frequencies are not calibrated individual race forecasts or causal estimates.

The race chart uses verified Jolpica lap-end classifications, with F1DB endpoints and FIA milestones. OpenF1 supplies supplementary event/timing records. The lap-33 checkpoint is **restart order**; the race suspension is marked between laps 32 and 33. Net positions gained are not an overtake count.

## Develop and validate

Use Node 24 LTS or a compatible Node release:

```sh
npm ci
npm run dev
npm test
npm run build
```

For browser verification, run a local server and then the browser script in another Terminal:

```sh
python3 scripts/serve.py --port 5181 --no-open
```

```sh
F1_DASHBOARD_URL=http://127.0.0.1:5181/ node scripts/browser_qa.mjs
```

The script uses installed Mac Chrome by default. Set `F1_CHROME_PATH` on another platform. It covers all presentation states, projector geometry, label collisions, future-data leakage, filtered cohorts, exports, mobile, and reduced-motion operation, while blocking external runtime requests.

To regenerate data, run `npm run prepare:data`. The script reads the supplied sibling `f1_dashboard_plan/` source snapshot and automatically unpacks its raw CSV ZIP when needed. Prepared data and statistical definitions were preserved in the redesign.

See `CHANGELOG.md`, the sibling `f1_dashboard_plan/output/F1_Dashboard_Impact_Redesign_Brief.md`, and the validation artifacts for the implementation's context and checks.

## Sources and acknowledgment

- [F1DB v2025.24.0](https://github.com/f1db/f1db/releases/tag/v2025.24.0), CC BY 4.0; derived data includes documented corrections.
- [Jolpica F1 API](https://api.jolpi.ca/ergast/), São Paulo 2024 lap chart.
- [OpenF1](https://openf1.org/docs/), supplementary case records; its stated educational/research and CC BY-NC-SA context applies.
- [FIA race account](https://www.fia.com/news/f1-vestappen-takes-stunning-sao-paulo-win-p17-grid-alpine-score-double-podium), case milestones.

Independent educational project, unaffiliated with Formula 1. OpenAI Codex assisted with analysis, drafting, coding, design, and verification. Preserve complete AI conversation exports for the course submission. The team remains responsible for interpretation and presentation.
