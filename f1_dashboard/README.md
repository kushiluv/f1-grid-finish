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

The root page opens with a short explanation of qualifying, the starting grid, and the finishing position. Ask the audience to estimate how often the driver wins from pole position, choose an estimate, and **Reveal the history**. **Skip to the evidence** is also available.

The four analytical chapters then tell a connected story:

1. **The pattern:** the start–finish heatmap, correlation and exact-match summary. Highlight gains, unchanged positions or losses without changing denominators. Click a starting place or cell to inspect it inline.
2. **Ability to recover:** one combined dot plot with top-ten, podium and win rates on a single 0–100% axis. Marker shapes and small vertical offsets distinguish overlapping outcomes. In Present, Top ten draws on entry; **Reveal podium** and **Reveal wins** add the next series while keeping earlier series visible. Back hides the latest reveal. Click a revealed legend to replay its left-to-right draw. Explore shows all three from the start. P16–22 appears first; 167 top tens, 12 podiums and one win from 1,185 starts. Select a row or outcome to inspect the counts. The outcomes overlap and must not be added.
3. **The circuit:** the preferred two aligned panels for whole-field correlation and wins from pole. Present starts with correlation only; **Reveal wins from pole** adds the second panel with a short animation. Explore shows both from the start. **Compare position change** adds the restored absolute-movement view, with a short left-to-right draw. **Order & pole wins** returns to the paired panels. Values are average absolute grid-to-finish differences among P1–10 starters who finished. The five contrasts are Monaco, Yas Marina, São Paulo, Sochi and Hungaroring. They include the smallest/largest movement averages and lowest correlation among the 19 circuits with at least eight races.
4. **The race:** São Paulo 2024, with car markers at observed lap-end ranks. **Play race** advances the trace and briefly holds key checkpoints. Pause, 1×/2× speed, scrubbing, replay and manual checkpoints remain available. Future observations stay hidden until revealed. Amber safety-car/VSC bands, a red-flag band and a short race-control note appear as playback reaches each milestone. The five original race checkpoints are retained.

The final screen is a 45–60-second summary of the proposal’s practical applications: **team strategy, circuit planning and betting analysis**. It uses three fixed examples: recovery cells for P16–22, a Monaco–Hungaroring position-change ruler, and Monaco–Yas Marina pole-win samples. One short action accompanies each. There are no filters or sliders to operate. The opening uses original circuit artwork, asphalt texture and a five-light gantry; the lights dim on the percentage reveal. Background motion runs once and respects reduced-motion settings. The F1 logo appears on the opening; artwork attribution is in `public/assets/SOURCES.md`.

Use the footer action or left/right arrows outside controls to move through presentation steps. Back reverses the reveal sequence. A chapter tab starts that chapter's initial beat. All modes and partial presentation steps have reproducible URLs. **Replay introduction** is available from the analytical screens.

See `public/STORY_SCRIPT.md` or open **Speaker notes** for the six-minute route. Every team member should contribute. Allow pauses for the audience's estimate and the chart reveals.

## Explore and inspect

**Explore** shows the full evidence and exposes year ranges, circuit selection, driver/team cohorts, and Belgium 2021 sensitivity. Driver highlighting is separate from filtering and leaves reference rates unchanged. Returning to **Present** loads the chosen chapter's fixed preset and resets Explore filters.

The São Paulo case is explicitly pinned to that race, even when other chapter filters differ. Explore can add Gasly and inspect the full lap chart. A partial presentation PNG includes its checkpoint in the filename and attribution. **Show full race** before exporting if the complete case is wanted. Circuit exports retain both panels, their intervals and data attribution.

**Data** opens the underlying driver–race records and CSV export. **Sources & methods** provides definitions, denominator rules, uncertainty, AI acknowledgment, and all 35 source-grid review decisions. Keyboard controls, text summaries, and the data table complement chart interaction. Reduced-motion settings preserve the same evidence without reveal animation.

## Data and analysis

The primary frozen source is **F1DB v2025.24.0**, with seven documented grid/status corrections, covering 2014–2025 Grands Prix. Sprint results and Belgium 2021 are excluded by default.

Default checked reference values:

- 251 races; 4,920 numeric-grid starts; 4,117 eligible finishers.
- Pearson r = 0.7646446838008164; 713 / 4,117 finishers kept exactly their starting place.
- Actual P1 starts that won: 134 / 250 = 53.6%.
- P11–15: 402 / 1,238 top-ten finishes; 2 / 1,238 wins.
- P16–22: 167 / 1,185 top-ten finishes, 12 podiums and one win: Verstappen’s São Paulo 2024 P17 start.

The selected-circuit movement detail uses **mean(abs(grid − finish))**, restricted to P1–10 starters who finished. It counts gains and losses as positive distances before averaging: Monaco 1.31, Yas Marina 1.52, São Paulo 1.95, Sochi 2.16 and Hungaroring 2.38. It is not abs(mean(grid − finish)), a variance statistic or an overtake count.

“Pole position” throughout the win comparison means the actual P1 starting slot, not the qualifying winner. Sources & methods cites the FIA São Paulo qualifying/race accounts for one verified penalty example; the story does not claim most back-grid recoveries are penalty-driven. Additional plain-text context dialogs have been removed.

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

For a production smoke test, run the Python server on port 5182, then `python3 scripts/check_launcher.py` and `node scripts/production_qa.mjs`. The latter checks a complete race playback, local logo, revised controls and exports. `python3 scripts/package_release.py` creates the verified release archive.

To regenerate data, run `npm run prepare:data`. The script reads the supplied sibling `f1_dashboard_plan/` source snapshot and automatically unpacks its raw CSV ZIP when needed. Prepared data and statistical definitions were preserved in the redesign.

See `CHANGELOG.md`, the sibling `f1_dashboard_plan/output/F1_Dashboard_Impact_Redesign_Brief.md`, and the validation artifacts for the implementation's context and checks.

## Sources and acknowledgment

- [F1DB v2025.24.0](https://github.com/f1db/f1db/releases/tag/v2025.24.0), CC BY 4.0; derived data includes documented corrections.
- [Jolpica F1 API](https://api.jolpi.ca/ergast/), São Paulo 2024 lap chart.
- [OpenF1](https://openf1.org/docs/), supplementary case records; its stated educational/research and CC BY-NC-SA context applies.
- [FIA race account](https://www.fia.com/news/f1-vestappen-takes-stunning-sao-paulo-win-p17-grid-alpine-score-double-podium), case milestones.

Independent educational project, unaffiliated with Formula 1. OpenAI Codex assisted with analysis, drafting, coding, design, and verification. Preserve complete AI conversation exports for the course submission. The team remains responsible for interpretation and presentation.

## Chart readability update

The current build retains the introduction and four-chapter route, with stronger chart contrast, aligned values and exact counts, a consistent heatmap colour scale, recovery reference tracks, and a clearer race timeline. See `CHANGELOG.md` for the design choices and their relationship to the presentation rubric. Open `Start Dashboard.command` to use the updated local build.

For the opening background, run `F1_DASHBOARD_URL=http://127.0.0.1:5182/ node scripts/opening_qa.mjs` against the built app. It checks the estimate/reveal flow, decorative layers, desktop and phone layouts, and reduced motion.
