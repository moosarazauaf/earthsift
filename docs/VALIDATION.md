# Does the risk check flag places that flood?

A first out-of-sample test of the **Flooding** rating in Earthsift's risk
check, run on the live site on 19 November 2026 (release 0.2.0-alpha.44).

> **Correction, 21 November 2026.** Sprints 1 and 2 scored the wrong Mehar.
> "Mehar, Pakistan" returned a village in Kot Diji taluka, Khairpur district,
> not Mehar in Dadu district, which is the place reported flooded in 2022. The
> Mehar rows below are kept as run, and describe that village. Read at the
> centre of Mehar Taluka, Dadu, the Flooding rating is **High** (34% of the
> square under water some of the time since 1984; 62% flat; land rises 177 m
> within 50 km; Hill torrents Low). So 8 of 8 flooded towns are still flagged,
> and 7 of 8 rather than 6 of 8 are rated High. The explanation below of Mehar
> as a rain-and-torrent flood the rating underrates was drawn from the wrong
> place and is withdrawn; Rajanpur remains the example. The taluka centre is
> not the town centre, whose own square may read differently. Place search now
> prefers the taluka and names the district (release 0.2.0-alpha.48).

## Design

The rating reads JRC Global Surface Water, which ends in **2021**. The 2022
Pakistan floods came after it, so the question is a fair one: *would the
rating, made from data up to 2021, have flagged the towns that flooded in
2022?*

- **Flooded in 2022 (8 towns):** places widely reported as badly flooded in
  August and September 2022: Dadu, Jacobabad, Mehar, Khairpur Nathan Shah,
  Rajanpur, Charsadda, Nowshera, Sohbatpur.
- **Not flooded (6 towns):** places not reported as flooded in 2022:
  Murree, Islamabad, Abbottabad, Faisalabad, Gujranwala, Lahore.

Each town was checked by asking Sentri *"Is {town}, Pakistan safe?"*, which
runs the risk check on a 10 km square around the town's centre. The group
membership comes from news and relief reporting, not from a mapped flood
extent; this is the weak point of the design (see Limits).

## Results

| Town | 2022 | Flooding rating | Ground under water only sometimes since 1984 |
|---|---|---|---|
| Dadu | flooded | **High** | 32% |
| Jacobabad | flooded | **High** | 27% |
| Mehar | flooded | Some | 4% |
| Khairpur Nathan Shah | flooded | **High** | 73% |
| Rajanpur | flooded | Some | 4% |
| Charsadda | flooded | **High** | 10% |
| Nowshera | flooded | **High** | 10% |
| Sohbatpur | flooded | **High** | 57% |
| Murree | not flooded | Low | |
| Islamabad | not flooded | Low | |
| Abbottabad | not flooded | Low | |
| Faisalabad | not flooded | Low | |
| Gujranwala | not flooded | Low | |
| Lahore | not flooded | **High** | 5% |

- **Flooded towns flagged:** 8 of 8 rated High or Some; 6 of 8 rated High.
- **Dry towns rated Low:** 5 of 6.
- **The one false alarm, Lahore:** the 10 km square around its centre takes
  in the Ravi floodplain, which has been under water before (the 1988 Ravi
  flood among others). The rating describes the area's ground, not the city
  centre's streets, and Lahore did not flood in 2022.
- **The two softer hits, Mehar and Rajanpur:** much of their 2022 flooding
  came from rain and hill torrents spreading over land that rarely holds
  water in the Landsat record, so only 4% of each square showed past water.
  A rating built on river history underrates rain-fed and torrent floods.

## What this does and does not show

It suggests the rating separates river-flooded lowland towns from upland and
long-dry towns, in this one region and season. It does **not** establish an
accuracy: 14 towns is far too few, the groups were chosen by hand from
reporting, and both groups are clear-cut cases. A proper test would score
the rating against a mapped 2022 flood extent (for example UNOSAT's or our
own Sentinel-1 FloodLens maps) over many randomly sampled squares, and would
report precision and recall with confidence intervals.

## Limits

- Group membership is from reporting, not mapped extents.
- One event, one country, one season.
- The squares are 10 km around a geocoded centre; a different square can give
  a different rating.
- The rating is designed to say "has flooded before", not "will flood", and
  misses rain-fed and torrent flooding on ground with little water history.

## Next steps

1. Score the rating against Sentinel-1 flood extents for 2022 over sampled
   squares in Sindh, Balochistan and southern Punjab.
2. Add a rain-and-terrain signal (low, flat ground in high-rainfall
   districts) so torrent and rain floods such as Mehar's and Rajanpur's rate
   higher.
3. Rate the clicked point as well as the square, so a city centre is not
   rated by the floodplain at its edge.

## Sprint 2: two candidate fixes, tested on the same towns

The two weak hits (Mehar, Rajanpur) were flooded mostly by rain and hill
torrents; the false alarm (Lahore) came from the floodplain at the square's
edge. Three signals were measured for all 14 towns before any rule changed
(release 0.2.0-alpha.46, local build, 19 November 2026):

| Town | 2022 | Flat ground (under 2°) | Land rises within 50 km | Centre point water since 1984 |
|---|---|---|---|---|
| Dadu | flooded | 50% | 815 m | 0% |
| Jacobabad | flooded | 45% | 213 m | 0% |
| Mehar | flooded | 34% | 193 m | 0% |
| Khairpur Nathan Shah | flooded | 54% | 1,704 m | 0% |
| Rajanpur | flooded | 32% | 1,377 m | 0% |
| Charsadda | flooded | 41% | 1,860 m | 0% |
| Nowshera | flooded | 23% | 1,658 m | 0% |
| Sohbatpur | flooded | 41% | 1,053 m | 0% |
| Murree | not flooded | 0% | 2,103 m | 0% |
| Islamabad | not flooded | 30% | 2,374 m | 0% |
| Abbottabad | not flooded | 7% | 5,611 m (a data spike) | 0% |
| Faisalabad | not flooded | 67% | 214 m | 0% |
| Gujranwala | not flooded | 41% | 46 m | 0% |
| Lahore | not flooded | 34% | 196 m | 0% |

A first measurement took the highest point over whole map tiles, which at
low zoom reach far past 50 km (Nowshera read 6,627 m); it was fixed to count
only cells inside the 50 km square, with a test, before these numbers.

**What the evidence decided:**

- **Rating the centre point: rejected.** Every town's centre, flooded or not,
  was water in 0% of views. Lowering a rating on that basis would have
  downgraded Dadu and Sohbatpur along with Lahore.
- **Flat ground alone: rejected.** Faisalabad, which did not flood, is the
  flattest of all (67%).
- **Hill torrents, flat ground at least 30% with land rising at least 800 m
  within 50 km: adopted as a separate rating, at most "Some".** It flags 5 of
  8 flooded towns, including Rajanpur, and 1 of 6 dry ones, Islamabad, whose
  Nullah Lai does carry flash floods. It does not flag Mehar, where the
  Kirthar range lies beyond 50 km.

**Caveat:** the 30% and 800 m thresholds were chosen by looking at these same
14 towns, so these counts are in-sample and flatter the rule. That is why it
never rates higher than "Some". It needs testing on towns it has not seen,
which is the job of the mapped-extent validation (next steps, item 1).

## Sprint 3: scored against mapped 2022 flooding on 60 random squares

The first test that does not rely on hand-picked towns (live site, release
0.2.0-alpha.46, 20 November 2026).

**Design.** Sixty 10 km squares were drawn at random (fixed seed 20220825)
inside lon 66.8 to 71.5, lat 24.8 to 29.8, which covers Sindh, eastern
Balochistan and southern Punjab. For each square the study recorded:

1. the risk check's **Flooding** rating, as a visitor sees it (`?at=` link);
2. the share of the square **newly under water** in 2022, from Earthsift's
   own Sentinel-1 FloodLens run (before 15 May to 15 June 2022, flood
   25 August to 10 September 2022).

A square counts as **flooded** if at least 5% of it was newly under water.
A rating of High or Some counts as **flagged**. The squares were drawn before
any result was seen, and no rule was changed after. Thirteen squares fell in
India (Thar desert), so the headline uses the 47 Pakistan squares. Two of
those had no radar result (the run timed out: squares 15 and 18), leaving 45.
The scripts and the raw results are in [validation/](validation/).

**Results, Pakistan squares (n = 45: 11 flooded, 34 not).**

| | Flooded | Not flooded |
|---|---|---|
| Flagged (High or Some) | 9 | 1 |
| Rated Low | 2 | 33 |

| Measure | Value | 95% interval (Wilson) |
|---|---|---|
| Recall: flooded squares flagged | 82% (9 of 11) | 52 to 95% |
| Precision: flagged squares that flooded | 90% (9 of 10) | 60 to 98% |
| Specificity: dry squares rated Low | 97% (33 of 34) | 85 to 99% |

- Every square rated **High** flooded (7 of 7). Mean share newly under water:
  High 29.5%, Some 15.0%, Low 1.7%.
- **The cut-off matters for recall.** At 2% newly under water recall falls to
  69% (9 of 13, interval 42 to 87%); at 10% it is 90% (9 of 10). Precision
  and specificity do not change. The rating catches the heavily flooded
  squares and misses some of the lightly flooded ones.
- **All 58 squares with a result, India included:** recall 83% (10 of 12),
  precision 77% (10 of 13), specificity 93% (43 of 46). Two of the three
  false alarms are in Jaisalmer, where old lake beds and ponds show past water
  but nothing new flooded in 2022.

**The misses and the false alarm, one by one.**

- **Square 22, Nasirabad: rated Low, 36% newly under water.** The worst miss.
  Its neighbours in Kachhi and Nasirabad (squares 9, 38, 40, 53) were rated
  High or Some and flooded by 30 to 66%. The water came from hill torrents
  and rain off the Kirthar and Sulaiman ranges onto ground with little water
  in the Landsat record. The
  torrent rule did not fire here either.
- **Square 44, Khairpur: rated Low, 8.5% newly under water.** A light, rain-fed
  flood on irrigated land.
- **Square 26, Kohlu: rated Some, 0.2% newly under water.** A hill district
  whose valley floors hold water in some years; it did not flood in 2022.

**The hill-torrent rating, out of sample.** In the Pakistan squares it rated
7 squares Some, of which 4 flooded (57%), against 7 of 38 (18%) for squares it
rated Low. It points the right way, but 7 squares is too few to tell, and it
missed square 22, the clearest torrent flood in the sample.

**What this shows.** On randomly drawn ground in the 2022 flood region, a High
or Some rating was a reliable warning (9 of 10 flagged squares flooded), and
a Low rating was mostly right (33 of 35). The weak side is recall on rain and
torrent floods over ground that rarely held water before 2022. That matches
sprint 1 and sprint 2, now on squares the rules were not tuned on.

**Limits.**

- The "truth" is our own FloodLens radar map, which has not itself been
  checked against an independent extent such as UNOSAT's. Radar misses water
  under crops and between buildings, so lightly flooded squares may be
  undercounted, which would make recall look worse and precision better than
  they are.
- Forty-five squares give wide intervals: recall could be as low as about
  half.
- One event, one region, one season, and 10 km squares only.
- About 1 square in 4 flooded, which is far more than in most regions, so the
  precision here would not carry over to a place where floods are rarer.

**Next steps.**

1. Fix the torrent miss: test a rule that looks for the hills up to 100 km
   away and counts dry-wash channels (squares 22 and 9 are the test cases).
   Score it on a fresh random draw with a new seed, not on these squares.
2. Check FloodLens against UNOSAT's 2022 extent on a few squares, so the
   truth used here has a known error.
