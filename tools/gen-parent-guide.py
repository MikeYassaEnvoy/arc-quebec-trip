#!/usr/bin/env python3
"""Generate a fully detailed PARENT-GUIDE.md from content/legs/*.json.
Run from anywhere: python3 tools/gen-parent-guide.py"""
import json, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent

HEADER = """# Parent guide — The Amazing Race Canada: Yassa Edition

Full detail for every leg: each step with its time, every challenge with its
checklist, quiz answers (your cheat sheet — he never sees this), timers,
photo prompts and points. Times are display-only — nothing is locked by the
clock. Legs unlock in order (finish a leg's pit stop to unlock the next).

## The hidden parent menu

Tap the little **version number ("v0.1.0")** in the corner of Race HQ
**7 times**. From there you can:

- **Jump to a leg** (unlocks it and everything before it) — use this if a day
  gets skipped or reordered.
- **Mark steps complete** — skip any stop that's closed / rained out.
- **Award a badge** manually (e.g. Fearless if the touch tank happens).
- **Content check** — confirms all the day's content loaded correctly.
- **Full reset** (long-press) — wipes everything. Don't do this mid-trip.

Kids can also long-press "Skip this stop" on any step — it's honor-system
everywhere; nothing ever requires a photo or a parent password.

## Scoring, badges, rivals (so you can play along)

- Every challenge lists its points; mini-games add up to 10 bonus points per
  session (only the first 6 sessions per leg count, so replaying is harmless).
- Placements are **scripted** — challenge scores never change them. The
  ceremonies explain placements as "time on the course"; points are his
  season score.
- Badges: legs may award several (see each mat line) + specials (First Win,
  French Speaker for real spoken French, Photographer after 10 photos,
  Fearless for the touch tank — that one's manual, from the parent menu).

---
"""

LEGS = {
    0: dict(
        h="Leg 0 — Backyard Trial Run (play at home before the race)",
        note=None,
        prep="20 relaxed minutes, nothing else. This teaches every mechanic "
             "(clue envelopes, checklists, stopwatch, the optional photo "
             "button, mini-games). Points here don't count toward the season.",
        mat="**Ceremony — \"Meet the Teams\":** Jon welcomes Team Yassa and "
            "introduces all four rival teams. No placements. Badge: 🎒 Race Rookie.",
    ),
    1: dict(
        h="Leg 1 — Sun Aug 2 · Kingston: Forts & Cannons (Ajax → Kingston)",
        note=None,
        prep="Nothing special. At Fort Henry, nudge him to look for the mascot "
             "goat and the year over the gate — the trivia uses them.",
        mat="**Mat: 2nd of 5** — Team Maple edges it. Non-elimination "
            "(\"everyone races on!\"). Badge: 💥 Cannon Blaster.",
    ),
    2: dict(
        h="Leg 2 — Mon Aug 3 · The Long Road to Montréal (via Cornwall)",
        note="Rain-day plan, revised Aug 2 — car day ends with the car parked "
             "in the lot until Thursday.",
        prep="Reserve a Biodôme time slot online and **activate the Museums "
             "Pass there** (Mon–Wed window covers Biodôme, Science Centre, "
             "Insectarium). Park at Olympic Park; luggage stays in the trunk. "
             "If the rain pauses in Cornwall, a riverfront leg stretch never hurts.",
        mat="**Mat: 4th of 5** — his roughest night; **Prairie Thunder "
            "eliminated**. Play the tension straight. Badges: 🛣️ Road Warrior "
            "+ 🐧 Penguin Pal (Biodôme — backfills onto his wall automatically).",
    ),
    3: dict(
        h="Leg 3 — Tue Aug 4 · Secrets of Old Montréal",
        note=None,
        prep="Metro all day (pass covers it). Let him \"navigate\" from the "
             "app map — the real route matches the game. Science Centre's "
             "posted hours are now **9–4**: be inside by noon.",
        mat="**Mat: 3rd of 4** — non-elimination leg. Badge: 🚇 Metro Master.",
    ),
    4: dict(
        h="Leg 4 — Wed Aug 5 · Maze, Bagels & the Park (all-metro day)",
        note="Revised Aug 5: SOS Labyrinthe replaces the Insectarium (his "
             "call!); all-metro day; the mountain runs Thursday morning.",
        prep="SOS Labyrinthe is INCLUDED in your Passeport MTL — show the QR "
             "code at the door; grab the checkpoint mission card at the "
             "entrance. **Schwartz's lunch**: the takeout counter beats the "
             "sit-down line — share one medium sandwich (peppery crust: let "
             "him try a corner bite before judging) and picnic at La Fontaine "
             "if the day is flowing. Flagging? Skip the step guilt-free. For "
             "detour *Taste*, buy one sesame and one plain bagel and have him "
             "close his eyes. Rain on the park: the Planetarium "
             "(pass-covered) is the swap.",
        mat="**Mat: 1st — FIRST WIN**, confetti; **The Tide Riders "
            "eliminated**. Badges: 🌀 Maze Runner + 🥯 Bagel Boss + ⭐ First "
            "Win — a three-badge night.",
    ),
    5: dict(
        h="Leg 5 — Thu Aug 6 · Race to the Walled City (Montréal → Québec City)",
        note="Revised Aug 4: 10 AM checkout; the Kondiaronk lookout opens the "
             "day with the car fresh from the lot.",
        prep="If the morning is fogged or wet, skip the lookout step in-app "
             "and leave straight away — everything after just happens "
             "earlier. If the Nouvelle-France festival isn't where expected, "
             "the costume scavenger works anywhere in the old town.",
        mat="**Mat: 2nd of 3** — close call; non-elimination. "
            "Badge: 🎩 Time Traveler.",
    ),
    6: dict(
        h="Leg 6 — Fri Aug 7 · The Citadelle Showdown (Québec City)",
        note="Slimmed Aug 5: band show, Battlefield Sprint and Morrin Centre "
             "cut — three anchors, real rest, gas in the tank for the big "
             "Saturday.",
        prep="Citadelle tour tickets (booked); arrive ~10:20 for the 10:45 "
             "English tour. **Warn him the noon cannon is genuinely loud** — "
             "cover ears at 11:59. Poutine lunch: anywhere on Grande Allée — "
             "Ashton is the classic. The 3:30–5:30 gap is real rest (Méga "
             "Parc next door to the hotel if he needs a burn-off). If sun "
             "appears, the Plains are the fort's front lawn — run free, no "
             "app needed.",
        mat="**Mat: 1st again** — **Team Maple eliminated** → the finale is "
            "vs. The Rock Hoppers. Badge: 🐐 Goat Whisperer.",
    ),
    7: dict(
        h="Leg 7 — Sat Aug 8 · Mazes, Dinosaurs & Ribs (Québec City → Brockville)",
        note=None,
        prep="**Check the Maizerets maze is open** before promising it (the "
             "in-app backup scavenger covers a closure). Ribfest: wet wipes "
             "for the judging; if fireworks happen at dusk, award a bonus "
             "badge from the parent menu.",
        mat="**Mat: 2nd of 2 — the heartbreaker**, loses \"by two minutes.\" "
            "Comfort accordingly; the finale tease follows. "
            "Badges: 🦖 Dino Tamer (+ Maze Runner if the SOS maze got skipped).",
    ),
    8: dict(
        h="Leg 8 — Sun Aug 9 · THE FINALE (Brockville → Ajax)",
        note=None,
        prep="**Big Apple mini-golf needs a counter check-in** — do it while "
             "he reads the clue. At home, let him run to a real mat/towel on "
             "the driveway before opening the final pit stop, then hand over "
             "the iPad — the finale is ~2 minutes of pure payoff. Don't skip "
             "the recap screen; every photo from the week is in it.",
        mat="**FINISH LINE: photo-finish WIN — CHAMPIONS!** Trophy, confetti "
            "storm, full season recap. Badge: 🏆 Race Champion.",
    ),
}

KIND = {
    "drive": "🚗 Drive",
    "detour": "🔀 DETOUR — choose ONE branch",
    "roadblock": "🚧 Roadblock",
    "route-marker": "📍 Route Marker",
    "speed-bump": "⚡ Speed Bump",
    "pit-stop": "🏁 Pit Stop",
}


def fmt_challenge(c, indent="  "):
    out = []
    bits = [c["type"], f"{c['points']} pts"]
    if c.get("timerSeconds"):
        t = c["timerSeconds"]
        bits.append(f"stopwatch target {t//60}:{t%60:02d}" if t >= 60 else f"stopwatch target {t}s")
    out.append(f"{indent}- **{c['title']}** ({' · '.join(bits)}) — {c['instructions']}")
    if c.get("checklist"):
        out.append(f"{indent}  - List: " + " · ".join(c["checklist"]))
    for q in c.get("trivia") or []:
        ans = q["choices"][q["answerIndex"]]
        out.append(f"{indent}  - Q: {q['q']} → **{ans}**")
    if c.get("frenchPhrase"):
        p = c["frenchPhrase"]
        out.append(f"{indent}  - Phrase: *{p['fr']}* (\"{p['phonetic']}\") = {p['en']}")
    if c.get("minigameId"):
        cfg = c.get("config") or {}
        extra = ", ".join(f"{k}: {v}" for k, v in cfg.items())
        out.append(f"{indent}  - Mini-game: `{c['minigameId']}`" + (f" ({extra})" if extra else ""))
    if c.get("photoPrompt"):
        out.append(f"{indent}  - 📸 {c['photoPrompt']}")
    return out


def fmt_step(s):
    out = []
    time = f"{s['scheduledTime']} — " if s.get("scheduledTime") else ""
    out.append(f"**{time}{KIND[s['kind']]}: {s['location']}**")
    if s.get("clueReveal"):
        out.append(f"- Clue says: \"{s['clueReveal']}\"")
    for c in s.get("challenges") or []:
        out.extend(fmt_challenge(c, ""))
    if s.get("detour"):
        for key in ("a", "b"):
            br = s["detour"][key]
            out.append(f"- **Branch {key.upper()} — \"{br['label']}\":** {br['blurb']}")
            for c in br["challenges"]:
                out.extend(fmt_challenge(c, "  "))
    return out


lines = [HEADER]
for leg_id in range(9):
    leg = json.loads((ROOT / f"content/legs/leg-{leg_id}.json").read_text())
    meta = LEGS[leg_id]
    lines.append(f"## {meta['h']}\n")
    if meta["note"]:
        lines.append(f"*({meta['note']})*\n")
    for s in leg["steps"]:
        if s["kind"] == "pit-stop":
            time = f"{s['scheduledTime']} — " if s.get("scheduledTime") else ""
            lines.append(f"**{time}🏁 Pit Stop: {s['location']}**")
            lines.append(f"- {meta['mat']}")
        else:
            lines.extend(fmt_step(s))
        lines.append("")
    lines.append(f"**Prep:** {meta['prep']}\n")

(ROOT / "PARENT-GUIDE.md").write_text("\n".join(lines))
print(f"wrote {len(lines)} lines")
