# Does the risk check flag places that flood?

A first out-of-sample test of the **Flooding** rating in Earthsift's risk
check, run on the live site on 19 November 2026 (release 0.2.0-alpha.44).

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
