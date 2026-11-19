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
