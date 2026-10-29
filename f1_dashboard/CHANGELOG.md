# Explain movement sample counts · 28 October 2026

- Replaced `n = …` with `… driver results`, and explained that each driver counts once per race. The same driver can contribute results from several races.
- Reserved enough room for the longer labels on mobile and desktop.

# Circuit heading clipping fix · 28 October 2026

- Anchored circuit panel headings inside the reserved top margin using fixed pixel spacing. They remain visible as the chart grows taller.
- Extended the browser regression check to 2560×1440 and checked labels against the plot boundary, where SVG clipping occurs.

# Recovery-first story and race playback · 28 October 2026

- Removed the navbar slogan and added the official F1 logo to the opening.
- Moved recovery directly after the heatmap, with P16–22 first and three simultaneous outcome panels sharing a 0–100% scale.
- Added São Paulo, Sochi and Hungaroring to the presentation circuit contrasts. Showed the extremes among circuits with at least eight races and distinguished correlation from movement.
- Replaced signed mean movement in the chart with mean absolute change for top-ten starters who finished. Source records and underlying calculations remain auditable.
- Added play/pause, playback speed, replay and observed-position car markers to the São Paulo trace. Navigation and manual inspection pause playback.
- Replaced the slogan ending with interactive evidence cards for strategy, circuit design and betting analysis. Removed extra plain-text context dialogs; definitions remain available under Sources & methods.
- Updated the six-minute speaking route, per-speaker execution plan, responsive layouts and browser/export checks.

# Presentation context and top-ten movement · 28 October 2026

- Simplified the opening title and definitions, emphasized pole position, removed extra headings and guess qualifiers, and made the 53.6% reveal explicit.
- Centered the pattern heading; moved the diagonal guide below the heatmap; clarified the 17.3% exact-position statistic and its finisher denominator.
- Explained whole-field correlation versus wins from pole. Added a selectable, shareable top-ten starter movement view with signed changes, absolute movement and finisher counts.
- Renamed the recovery section and described each selected outcome in plain language. Added FIA-sourced penalty context without unsupported claims about most recoveries or car pace.
- Updated the six-minute speaking route, per-speaker execution plan, methods and regression checks. Existing data snapshot and canonical metrics are preserved.

# Chart clarity refinement · 28 October 2026

Refined the existing four-chart story in response to the request for more appealing, readable evidence. The opening and core narrative are retained.

- Heatmap: stronger low-frequency contrast, finer cell boundaries, and one fixed 0–100% colour scale for both finish positions and the DNF/DSQ strip. The exact-match summary now includes a proportional bar and explicit finisher counts. Selected starting-place rates have small supporting bars.
- Circuit comparison: aligned numeric columns, alternating row guides, clearer selected rows, darker uncertainty intervals and plain-language correlation endpoints. Full correlation and percentage scales are retained; capped lines identify intervals separately from the pale zero-to-estimate guides.
- Recovery: stronger bars on 100% reference tracks, a selected-row highlight, and larger percentages with separately positioned counts. Positive rates below 1% remain at their true x positions; their selectable dots are explained in the caption. Missing groups do not receive a zero-length bar or a full track.
- Race: distinguish unrevealed time, lightly identify the top-three zone, retain past checkpoints, and display each driver's current position and net change from their starting place. No future results are exposed during partial reveals.
- Corrected projector-size text spacing and compact race-panel layout. Added browser checks for shared colour meaning, proportional counts, rare-value selection and annotation collisions.

Rubric alignment: **simplicity** (same four analytical chapters), **integrity** (fixed scales, counts, exclusions and uncertainty), **salience** (stronger marks, direct labels and purposeful highlights). The data snapshot, numerical calculations and six-minute route are unchanged.

# Interactive presentation redesign · 27 October 2026

Implemented the requested visual/storytelling brief on the existing local application.

- Added a dark F1 opening, a simplified vector starting grid, three audience estimates, and a data-derived 53.6% reveal.
- Replaced the repeated three-card presentation layout with chapter-specific evidence stages. Enlarged the heatmap into square cells and moved the starting-place shortcuts beside its interpretation.
- Changed heatmap cell clicks to explain selections inline before opening records.
- Added a staged circuit comparison and synchronized selected-row highlighting across both panels.
- Aligned recovery rates and exact result/start counts in a separate value column. Preserved the fixed percentage scale and tiny nonzero rates.
- Linked the recovery chapter to the verified sole winning P16–22 record in the default study: São Paulo 2024.
- Added deterministic race checkpoints and progressive trace visibility, with no future endpoint/result text during partial reveals. Clarified restart order versus the race suspension.
- Added a full-stage conclusion, replay controls, presentation-state URLs, and matching Back/Next/keyboard behavior.
- Updated speaker notes, the six-minute script, documentation, browser checks, and release packaging.
- Preserved canonical calculations, cohort semantics, source/correction records, uncertainty rules, offline operation, records, and exports.

The redesigned app is a local build. Use `Start Dashboard.command` or the Python launcher to open it. The delivered browser report and screenshots record the actual validation results.


## Final visual refinement

Retained the same four tabs, order, question and race case. Reviewed Navigate A (dashboard hierarchy, single-screen layout, connected interaction and action orientation) and Navigate B (questions and decisions before tooling). Retained the preferred paired circuit panels with São Paulo and contrasting circuit histories. Combined recovery outcomes on one shared-axis dot plot. Added denominator-preserving heatmap focus and redesigned the same three potential impacts with recovery cells, movement-frequency curves and a pole-win benchmark with intervals. Updated source definitions, exports and the existing six-minute speaking route. No new causal or predictive claims; the frozen source data are unchanged.

## Outcome replay and circuit reveal

Added accessible, replayable outcome legends with stronger series colours and circle/diamond/triangle markers. Recovery lines draw across the shared axis while labels and markers appear at their true endpoints. Restored the hidden pole-win panel and its reveal/Back steps. Animation is confined to rendered SVG, leaves all data and exports exact, and is skipped or cancelled when reduced motion is requested. The four-tab story is unchanged.


## Sequential recovery reveal

Present now draws Top ten on entry, adds Podium and then Win using the footer Next action, and keeps previously revealed outcomes on the shared scale. Back hides later outcomes; unrevealed series, numeric labels, outcome controls and the race callout stay hidden or disabled until their step. URLs and exports preserve the reveal stage, and Explore retains the full comparison. Reduced-motion settings show each newly revealed outcome immediately.


## One-minute impact summary

Condensed the closing into three fixed examples and one short use per audience. Removed all closing dropdowns, the movement threshold slider, distribution curves and the additional pole-rate difference/interval comparison. Kept exact recovery evidence, a directly labelled Monaco–Hungaroring mean-absolute-change ruler, and Monaco–Yas Marina pole-start tiles that show the small samples. Added restrained entry animation with reduced-motion support and updated the 45–60-second speaking route. The four analytical tabs and underlying data are unchanged.


## Absolute movement and race-control context

Restored the circuit Position change view with mean absolute grid-to-finish values, explicit finish counts and a short entry animation. Added a presentation step and view switch while retaining the paired correlation/pole panels. Added selected São Paulo VSC, safety-car, red-flag, restart and finish milestones from the frozen OpenF1 messages and FIA account. Plot shading clips to the revealed lap; a compact note follows the latest reached event, and playback briefly holds at those milestones. Preserved all rank traces, source corrections, outcome rates and the one-minute closing. Source-message laps are distinguished from narrative race laps in Methods and the speaking notes.
