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
