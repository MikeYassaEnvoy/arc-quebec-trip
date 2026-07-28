# MetroNavigator (`metro-navigator`)

**Config:** `{ from?: string, to?: string }` — station id or label, accent/punctuation tolerant (`"Place-d'Armes"` == `place-darmes`). Default `Guy-Concordia → Place-d'Armes` (transfer at Berri-UQAM). No content file: the map is inline SVG.

**Map:** Green line (Guy-Concordia – Place-des-Arts – Berri-UQAM – Viau) and Orange line (Place-d'Armes – Berri-UQAM – Laurier). The route is computed by BFS, so any from/to pair among those six works.

**Play:** tap stations in order; wrong taps wiggle, correct segments light up, the train slides station to station and loops the finished route.

**Scoring:** `score` = route hops − wrong taps (floor 0), `maxScore` = route hops (3 for the default route). `onComplete` fires on the "Collect points" button.
