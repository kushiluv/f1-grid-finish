# Six-minute speaking route · revised interactive dashboard

BAIT 518 · Group 3 · Section BA2. Assign chapters across the actual group so that every member speaks. The six-minute route leaves room in the seven-minute slot for handoffs and slower explanations. Rehearse with the app and a projector.

## 0:00–0:35 · Make an estimate

“Before a Formula 1 race, qualifying helps set the starting order, although penalties and rules can change it. That lineup is the grid. Pole position here means the actual front starting slot, P1. A finishing position is the official result after the race; a smaller number is better.

How often do you think the driver wins from pole position—25, 50, or 75 percent?”

**Action:** select an audience estimate, then **Reveal the history**.

“In our included 2014–2025 races, it was 134 wins from 250 actual pole-position starts: 53.6%. A useful head start, but hardly a guarantee. What about the whole field?”

**Action:** **Explore the pattern**.

## 0:35–1:40 · The pattern

“Every column shows outcomes from one starting place. Darker cells mean a larger share of those starts. The diagonal is an unchanged position; above it is a better finish, below it a worse finish.

The concentration near the diagonal shows a strong relationship. Among finishers, the correlation is about 0.76. That does not mean 76% prediction accuracy.

Only 17.3% kept exactly their starting position. Those facts fit together: related rankings can still change. Drivers who did not finish or were disqualified stay visible in the separate strip. We do not treat them as a made-up finishing rank.”

**Action:** select **P10 · middle** to demonstrate one column. Do not open the records during the main presentation. **Compare the circuits**.

## 1:40–2:50 · The circuit: order, winner, movement

“A circuit is the race track. A correlation closer to one means the finishing order more closely follows the grid. Monaco is about 0.86; Yas Marina is 0.79. Does that also tell us who wins from pole?”

**Action:** **Show wins from pole**.

“Pole starters won six of ten times at Monaco, compared with eleven of twelve at Yas Marina. Following the whole field and identifying the winner are different questions. These are small samples.”

**Action:** **Compare positions gained**.

“Now look only at top-ten starters who finished. At Monaco the average net change is nearly zero; at Spa it is a loss of 0.60 places. Gains and losses can cancel: Monaco still has an average change of 1.31 places in either direction. This is not an overtake count.”

**Action:** **Explore recovery**.

Keep this section to about 145 spoken words. Do not read all four tracks aloud or open the strategy context during the main route. Pit stops, safety cars and strategy can affect order; these comparisons do not isolate track design or the cause of a position change.

## 2:50–4:00 · Ability to recover

“For someone starting 11th to 15th, what counts as a recovery? Top ten means a finish from first to tenth. In this group, 402 of 1,238 starts reached the top ten: about one-third.

Now change the goal to winning.”

**Action:** **Change goal: win**, or click **Win**.

“Only two of those same starts produced a win: 0.16%. Same denominator, same scale, a very different expectation. Podium, meaning the top three, is another goal.

What about starting even farther back?”

**Action:** **What about farther back?** selects P16–22 and preserves Win.

“One winner from 1,185 starts in that back group. A fast car can start back here after a penalty; starting position is not a complete measure of pace. Our next race is that one winning record.”

**Action:** **Follow that race**.

## 4:00–5:30 · Follow the exception

“This is São Paulo in 2024, deliberately selected as an exception. Verstappen qualified 12th but a five-place power-unit penalty put him 17th. Norris starts first; Ocon fourth. We will follow their actual lap-end positions.”

**Action:** **Lap 11: early recovery**.

“By lap 11, Verstappen was already sixth. The starting order was changing.”

**Action:** **Lap 33: restart order**.

“After pit visits and the race suspension, Ocon led Verstappen, with Norris fourth. A red flag temporarily stops the race. The shaded band marks the suspension between laps 32 and 33; it does not measure its elapsed duration.”

**Action:** **Lap 43: a new leader**.

“Verstappen had passed Ocon for the lead. Norris was seventh at the end of this lap.”

**Action:** **Reveal the finish**.

“Verstappen finished first from 17th. Norris finished sixth from first; Ocon finished second from fourth.

Sixteen net places gained is not sixteen overtakes. Pit stops, interruptions and other drivers' outcomes also change the order. This case shows the sequence; it does not isolate how much any single event caused the result.”

**Action:** **The takeaway**.

## 5:30–6:00 · Land the use case

“A head start, not a verdict. Starting and finishing positions were strongly associated in this study.

For a race preview, start with that historical baseline. Name the circuit and the desired outcome. Then leave room for the race itself.

The relationship also reflects the car and driver. This dashboard helps frame expectations, rather than guarantee a result.”

Stop here. Explore, data records, and methodology remain available for questions.

## Q&A notes

- **Is this mainly the car and driver?** They contribute. Demeaning within driver–team–season groups gives an exploratory residual correlation of about 0.38, below the pooled 0.76. This is a robustness check, not a causal decomposition.
- **Why exclude Belgium 2021?** It had no competitive green-flag running. Including it changes the overall correlation only slightly. Explore includes the sensitivity switch.
- **Why only ten first-position starts at Monaco across eleven races?** Leclerc did not start in 2021. This metric counts actual P1 starts rather than pole awards.
- **Are these chances for the next race?** They are historical group frequencies. An individual forecast needs a validated model and other information.
- **Why the back-group count?** The default 2014–2025 cohort contains 1,185 eligible numeric-grid starts from P16–22 and one winning record: Verstappen, São Paulo 2024, P17.
- **Could this prove which circuit allows more overtaking?** No. Net position changes and circuit correlations do not isolate passing difficulty or track-design effects.

- **Why not say “qualified on pole”?** The 53.6% is 134 wins from 250 actual P1 starts. Qualifying first, receiving a pole award and actually starting P1 are not always the same thing.
- **Why can all the top-ten movement averages be negative?** We follow only P1–10 starters who finished. Some finish outside the top ten; no balancing requirement applies to that subset. Signed changes can cancel, so read the mean absolute movement alongside the mean net change.
- **Do most back-row recoveries come from penalties?** This analysis does not establish that. São Paulo 2024 is one verified example: [FIA qualifying report](https://api.fia.com/news/f1-norris-claims-pole-dramatic-wet-qualifying-sao-paulo-verstappen-qualifies-12th), [FIA race report](https://api.fia.com/news/f1-vestappen-takes-stunning-sao-paulo-win-p17-grid-alpine-score-double-podium).
