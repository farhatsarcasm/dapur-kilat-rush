# dapur-kilat-warung-rush

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/farhatsarcasm/dapur-kilat-warung-rush/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/farhatsarcasm/dapur-kilat-warung-rush/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

Dapur Kilat — Warung Rush: a complete original HTML5 cooking game. Run an Indonesian warung during the lunch rush: read the order tickets, chop on the board, cook in the wok, stack dishes on the plate, and serve before customers walk out. Head Chef AI, a strict rule-based head chef, barks the best next step, praises fast serves, and warns about the grumpy customer — and highlights the right button with a glow. Two modes: Rush (150-second timed shift, 3 stars) and Chill (no timer, no fail). No ads, no in-app purchases, no lives, no energy — every upgrade is earned with coins from serving food. Static files only, works offline.

## A warung that feels alive

The warung is calm and cozy, not a neon arcade: warm wood, golden light, plants, steam from the food, a cat asleep in the corner, and soft WebAudio ambience (gentle plucks + chatter murmur, M to mute). Customers are characters with a life, not faceless tickets:

- **The young group** (Raka & Dina) — hanging out, laughing ("haha, enak banget!"), sharing food, tipping well.
- **The old couple** (Mr Harto & Mrs Lastri) — slow and unhurried, hearts and smiles, eating together.
- **Sam the Guard** — the smiling security guard at the door who greets every arriving customer ("Welcome in!").
- **The grumpy customer** (Mr Grumpy) — impatient, crossed arms, complains ("So slow!", "This is cold!"), drains patience 1.7x faster and tips little. Serve him correctly and on time for a score bonus and the rare **"Grumpy Customer Pleased!"** achievement.
- **Head Chef AI** — the strict head chef: "HURRY! Customer 2 is waiting!", "Great, keep it up!", "Careful, that customer is grumpy!".

Customers chat with each other between orders, get visibly impatient with a sigh ("Huh…") instead of a harsh red alarm, and in Chill mode they never walk out angry — they just chat longer. Nine original warung dishes (nasi goreng, mie ayam, gado-gado, sate, ayam geprek, bakso, es teh…), combo scoring, coin-bought stove/decor upgrades, day/shift progression, tutorial, and win/lose screens.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Or open `game/index.html` through any static file server. Click to play: tap an order, tap ingredients (keys 1-9, 0), tap ready ingredients to plate them, Space to serve. K toggles Head Chef AI, P pauses, M mutes.

---

<sub>Entered on [make.fun](https://make.fun/?ref=vx84d3tw&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
