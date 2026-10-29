# Grid / Finish — six-minute speaking route

**BAIT 518 · Group 3 · BA2**
**Question:** How strongly is starting grid position associated with race outcomes in Formula 1?
**Current route:** opening → pattern → recovery → circuits → São Paulo → practical impact.

Use Present mode. The footer advances the story; chapter buttons return to the start of that section. Keep Sources & methods, record tables and Explore filters for questions. The full speaking allocation and operating cues are in `PRESENTATION_EXECUTION_PLAN.md`.

## 0:00–0:35 · Explain the grid and invite an estimate

“Qualifying helps set the starting order, although penalties can change it. That lineup is the grid. Smaller position numbers are better; pole position here means the actual front starting slot, P1.

How often do you think a driver wins from pole?”

**Action:** invite a quick estimate, choose a percentage, then **Reveal the history**.

“In the races we studied, 134 of 250 P1 starts became wins: 53.6%. Let’s look beyond the winner.”

**Action:** **Explore the pattern**.

## 0:35–1:30 · Read the whole-field pattern

“Each column is a starting place. The vertical axis shows finishing position. Darker cells mean a greater share of starts ended there. The diagonal is the same starting and finishing place.

The darker band near that diagonal shows a strong relationship: better starts tend to accompany better finishes. Among finishers, the correlation is about 0.76. That is not 76% prediction accuracy.

But only 17.3% of finishers kept exactly the same place. So a strong relationship still leaves room for change.”

**Action:** optionally choose **Same position** to isolate the diagonal, then **All finishes**. Select **P17 · back** to highlight the starting column. Keep this demonstration brief.

“What does that room for change mean for someone starting at the back?”

**Action:** **Explore recovery**.

## 1:30–2:25 · Three outcomes, the same starting group

“Read the top row first: starts from P16 to P22. There were 167 top-ten finishes from 1,185 starts—14.1%. From those same starts, there were 12 podiums and just one win.

All three outcomes sit on one zero-to-100% axis, with separate marker shapes and small vertical offsets so close rates remain readable. A podium means a top-three result. Wins are already included in podiums, and podiums in top-ten finishes, so we do not add the rates.

Moving down toward the front of the grid, all three outcomes become more frequent. Recovering into the top ten is a more attainable historical outcome than winning. A car at the back is not necessarily slow: penalties can put competitive cars there.

The one back-group win was São Paulo in 2024. Before following it, does the circuit change our expectations?”

**Action:** **Top ten** draws automatically when this page opens. Read P16–22, then press **Reveal podium** and **Reveal wins** as you name each outcome. Each new series draws from left to right in about one second; earlier series remain visible. The next click is **Compare the circuits**. A revealed legend can replay its animation; Back hides the latest reveal.

## 2:25–3:45 · Separate order, winning and movement

“A circuit is the race track. The left panel shows how closely starting and finishing order align. Closer to plus one means closer alignment. Does this also tell us how often the driver starting first wins?”

**Action:** click **Reveal pole comparison** in the chart or **Reveal wins from pole** in the footer. The right panel appears with a short left-to-right reveal; the correlation panel stays fixed.

**Action:** point to Monaco, then select **Yas Marina** in either panel or the selector.

“Monaco has stronger alignment: 0.86 versus 0.79 at Yas Marina. Yet pole starters won six of ten times at Monaco and eleven of twelve at Yas Marina. Whole-field order and the winner are different questions. These are small samples; the capped lines show 95% intervals.”

**Action:** point to **Sochi**, then select **São Paulo**. Press **Compare position change**; the absolute movement bars draw in from the left.

“Sochi has the weakest correlation, 0.68, among the 19 circuits with at least eight races. São Paulo is 0.73, with eight wins from eleven pole starts. We have included more stable and less aligned histories, so the comparison is not just about famous tracks.

The movement view shows average absolute position change among top-ten starters who finished: gains and losses both count. Monaco is lowest at 1.31; Hungaroring highest at 2.38. These are position changes, not overtakes.

Our next driver started 17th in São Paulo, outside this top-ten subset. Let’s follow his race.”

**Action:** **Watch São Paulo 2024**.

## 3:45–5:15 · Follow São Paulo 2024

“Verstappen qualified 12th; a five-place power-unit penalty put him 17th. Norris started first and Ocon fourth. First place is at the top. Each car symbol marks an observed lap-end position.”

**Action:** **Play race** at **1×**. The full run takes roughly 45 seconds, with short holds at the main checkpoints and race-control events. Amber shading marks safety-car or virtual-safety-car periods; red marks the stoppage. The sidebar gives the latest milestone. Pause for explanation if needed; use checkpoint buttons to recover your place.

- **Lap 11:** “Verstappen had already reached sixth.”
- **Lap 33:** “Heavy rain brought out a safety car; Colapinto’s crash then caused a red flag. After earlier pit stops and the suspension, Ocon led the restart order, with Verstappen second and Norris fourth.”
- **Lap 43:** “Sainz’s crash caused another safety car. After it came in, Verstappen passed Ocon for the lead on lap 43. Norris was seventh at this lap’s end.”
- **Lap 69:** “Verstappen won from 17th; Ocon finished second and Norris sixth. Sixteen net places gained does not mean sixteen overtakes.”

“This is a deliberately selected exception, not the usual result from the back. It shows why the grid alone cannot tell the complete story.”

**Action:** **What can we use this for?**

## 5:15–6:00 · Explain the practical impact

“These findings have three practical uses.

For teams, 14.1% of starts from P16 or farther back ended in the top ten. That gives a starting point for setting a realistic goal before weighing strategy risks.

For circuit planners, top-ten starters who finished changed 1.31 places on average at Monaco, compared with 2.38 at Hungaroring. That helps identify where to study track layout and passing more closely; it is not an overtake count.

For betting analysis, the pole starter won six of ten Monaco races, but eleven of twelve at Yas Marina. This illustrates why the circuit belongs alongside current pace and conditions when assessing a race.

Starting position gives us a baseline. The race context determines how we use it.”

**Action:** point left → middle → right. No dropdowns or sliders. Allow about 15 seconds per example and finish facing the audience.

## Q&A notes

- **Why not say “qualified on pole”?** Actual P1 starts, qualifying first and the official pole award can differ. The opening is 134 wins / 250 actual P1 starts.
- **Why ten P1 starts at Monaco across eleven races?** Leclerc did not start in 2021; nonstarters do not enter that denominator.
- **How were the circuit contrasts chosen?** Among 19 circuits with at least eight races in 2014–2025, Monaco has the smallest average absolute change for top-ten starters who finished, Hungaroring the largest and Sochi the lowest start–finish correlation. Yas Marina contrasts order with pole wins; São Paulo connects to the case. These are sample extremes, not proven population rankings.
- **What does absolute movement mean?** Average `abs(grid − finish)` over eligible records, not `abs(average(grid − finish))`. It measures distance in position, whether gained or lost. It is not statistical variance or an overtake count.
- **Why restrict movement to P1–10 starters?** It asks how stable the front half of the grid is. It excludes nonfinishers and starts farther back, so it cannot describe every driver’s movement.
- **Why not stack top ten, podium and win?** They overlap: a win is also a podium and a top-ten result. The combined dot plot places each rate on the same axis without adding them. Shapes and small vertical offsets keep the three outcomes distinct.
- **Is this mainly the car and driver?** They contribute. Within driver–team–season demeaning gives a residual correlation around 0.38, below the pooled 0.76. This is a robustness check, not a causal decomposition.
- **Why exclude Belgium 2021?** No competitive green-flag running. The Explore sensitivity switch includes it; the main conclusion changes little.
- **Do penalties explain most recoveries?** This analysis does not establish that. São Paulo is one verified example: [FIA qualifying account](https://api.fia.com/news/f1-norris-claims-pole-dramatic-wet-qualifying-sao-paulo-verstappen-qualifies-12th) and [FIA race account](https://www.fia.com/news/f1-vestappen-takes-stunning-sao-paulo-win-p17-grid-alpine-score-double-podium).
- **Where do the data come from?** Frozen F1DB v2025.24.0, with documented corrections; Jolpica lap positions and FIA milestones for the race, with supplementary OpenF1 records. Definitions and all grid-review decisions remain in Sources & methods.

## Reading the refined charts

- In Present mode, pole wins begin hidden. The reveal button adds them without changing the correlation scale; Back hides them again. The circuit panels retain separate scales: correlation on the left and pole-win percentage on the right. Selecting either marker updates the same circuit details. Press Compare position change to draw the separate absolute-movement view. The two paired panels remain available under Order & pole wins. Correlation is not statistical variance. The same five circuit contrasts include São Paulo, stable Monaco and the less aligned Sochi history.
- Heatmap focus buttons dim other outcomes while retaining original column denominators. Selecting **Same position** shows 713 / 4,920 eligible starts; the sidebar's 17.3% is 713 / 4,117 finishers. These are deliberately different denominators.
- The closing uses three fixed examples. Recovery cells show one percentage point each, including a partially filled final cell; the count is 167/1,185. The circuit ruler shows mean absolute change among top-ten starters who finished: Monaco 127/97 = 1.31 places; Hungaroring 255/107 = 2.38. Each pole-win square is one actual P1 start, grouped by outcome rather than chronological order.
- The circuit ruler uses average absolute grid-to-finish change. A driver appearing in multiple races contributes multiple finishes; the sample counts are not unique people.
- The closing pole comparison shows the sample directly: Monaco 6 wins / 10 pole starts; Yas Marina 11 / 12. These are small historical samples, not a calibrated forecast. Uncertainty intervals remain available in the circuit chapter.

Animation only reveals rendered marks; it never interpolates the data values. Repeated legend clicks replay an outcome. Reduced-motion settings show the complete evidence immediately. Explore shows both circuit panels from the start.

Race-control notes use recorded OpenF1 message laps. Selected amber/red bands group those milestones on a lap axis, not exact wall-clock durations or a complete flag log. The second safety-car message is at recorded lap 39; the FIA narrative describes Sainz’s crash on lap 40. The car came in at the end of 42 and racing resumed on 43. Sources & methods explains this mapping.
