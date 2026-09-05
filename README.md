# Tower Siege

A 3D block-stacking duel that runs in the browser. One side stacks wooden blocks
on a table under real rigid-body physics, the other side spends a budget on
wrecking balls, charges, grease and earthquakes trying to bring the stack down.
Every attack is planned and telegraphed before the building phase, so the builder
always gets to see what is coming and build around it.

**[Play it](https://ricardobertolin.github.io/stacker_build_app/)**

No install, no build step, no server. `index.html` is the whole game: one file,
three.js and cannon-es pulled from a CDN at load.

## The match

A match alternates two phases and repeats until one side runs out.

The **saboteur** plans first. They get an energy budget that grows with the round
and spend it on attacks, aiming each one at the tower. Every attack placed shows
up as a marker in the world and a card in the queue.

The **builder** then gets a build phase with a clock and a fixed ration of pieces
(7 in round one, 5 after that, climbing back to 7 as the rounds pass). The siege
queue is already on screen. Anchors bolt a piece to whatever it lands on. Wards
cancel a queued attack outright, spent by clicking its card. Swaps cycle the
piece in hand.

Then the siege runs, one attack at a time, and whatever is left standing is
measured against what was there before.

Between rounds the site is cleared. A block is hauled away if the siege moved
it, it is lying on the table rather than on the structure, and nothing is
resting on it. All three have to be true: a foundation you laid flat and have
not built on yet is not wreckage, and a base block that got shoved but is still
carrying the tower is not wreckage either. What is left is what held. The other
half of that deal is bedding: a block that comes through a whole siege without
moving grips harder afterwards than one dropped a second ago, so a structure
that has stood is worth more than the same blocks in a pile.

Losing 38% of your height in one siege costs a strut, 72% costs two, and a tower
flattened to nothing costs one automatically after a round's grace. Four struts
gone and the saboteur wins. Coming through a siege with 90% of your height intact
is a clean round: it earns a Ward and costs the saboteur one of three patience.
Run the saboteur out of patience and the tower wins.

Anything the crew hauls off the site comes back as material. Every second block
cleared is an extra placement next round, up to two, which pays out exactly when
the tower has just come down and pays nothing on a clean round.

Every fifth round is a **surge**. The saboteur's whole kit comes out in its
empowered form at a surcharge, and the builder is handed a Keystone, an anchor
that ties in every block it touches and survives blasts that snap ordinary ones.

## The saboteur's kit

Seven tools, all of them available to the AI and to you on exactly the same
terms. The empowered name is what the tool is called on a surge round.

| Tool | Cost | Aim | Empowered |
| --- | --- | --- | --- |
| Gust | 2 | a height | Gale, starts far lower and blows twice as long |
| Quake | 2 | nothing, shakes the table | Upheaval, harder and twice as long |
| Grease | 2 | a block, or bare table for a pool | Spill, slicks the block and floods the floor under it |
| Charge | 3 | a point, snaps anchors in reach | Demolition, far wider blast |
| Drop Weight | 3 | a point, an iron mass parked above it | Anvil, heavier and bigger |
| Snatch | 3 | a block, anchored ones are safe | Extraction, rips it out bolts and all |
| Wrecking Ball | 4 | a face and a height | Ruin, heavier ball on a longer chain |

Grease is permanent. Everything else fires once and is gone.

## Modes

**Builder** puts you on the tower against the AI saboteur.

**Saboteur** flips it: you spend the energy and aim the attacks, and the AI
builds under the threat you just telegraphed.

**Play a friend** links two browsers over PeerJS. Pick your side, send the link,
and whoever opens it takes the other. There is no attempt to run the physics
twice: the host simulates the world and streams snapshots, the guest sends
intents back and owns only its own aim. No account and nothing to install on
either end.

**Watch them train** hands both sides to the AI and runs matches back to back at
up to 16x. Progress is saved in the browser, and the champions it produces are
the ones you play against in solo. Above 8x a frame can be asked for more
physics than it has time for, so the loop gives the rest of the frame back
rather than locking the tab: the tick sequence is unchanged and the match plays
out identically, it just advances a little slower than the number on the button
when the machine cannot keep up. On a phone the training readout folds down to
the four numbers that move, and tapping its header opens the rest.

## Controls

Building:

```
Arrows      move the piece          PgUp/PgDn  raise and lower
Q/E         yaw                     R/F        pitch
N           swap piece (limited)    Space      drop
G           arm anchor              H          arm Keystone
Enter       ready
```

Sabotaging:

```
1-7                      pick a tool
click the tower          aim and place it
Right-click / Backspace  undo the last one
Esc                      deselect         Enter  end turn
```

Everywhere: drag to orbit, wheel to zoom, `P` pause, `M` mute, `T` cycles the
look. Click an attack card to spend a Ward on it. On touch devices the on-screen
pads take over for moving and rotating the piece.

## Self-play

Both AIs are scoring functions, and every coefficient either of them leans on
sits in one table. The builder weighs height, support, base contact, remaining
surface, telegraphed threat and drift off the axis. The saboteur carries an
appetite per tool plus targeting parameters like how high up the ball aims and
whether it prefers altitude or the load-bearing block.

Training is a (1+1) hill climber per side. A candidate is evaluated over a batch
of matches and judged on the mean, because one run of a physics game is far too
noisy a sample to promote on, and it replaces the champion only if it beats the
champion's running rating. The rating decays toward what it keeps measuring, so
a champion that only won because its opponent was weak does not sit there
forever.

Measurement mode freezes both champions and stops learning. Use it when the
numbers are meant to say something about the game rather than about the
optimiser, since a win rate taken while both sides are mutating is partly an
artefact of two hill climbers chasing each other and can sit at a contented 50%
on top of a badly unfair ruleset.

`Tele.begin('some label')` from the console starts a measurement pass: it
freezes the champions, empties the ledger and rewinds the dice, so two passes
either side of a rules change play the same matches with the same players and
differ only by the change. `Tele.report()` prints what happened. That is how the
wreckage rule was checked in: 30 matches before, the same 30 after, builder win
rate 16.7% both times, with blocks standing at the end of a round falling from a
carpet of 28 by round eight to a steady 8.

It is also what the builder pass was decided on, since 16.7% was too low to
leave alone. Six variants over the same seeds, frozen champions:

| variant | builder wins | rounds per match |
| --- | --- | --- |
| 2.1, before any of this | 16.7% | 4.2 |
| 3.0, wreckage cleared | 16.7% | 4.1 |
| salvage only | 5% | 4.3 |
| more pieces | 20% | 4.2 |
| slower clocks | 30% | 5.1 |
| clocks + pieces | 35% | 4.8 |
| clocks + pieces + a fourth strut | 45% | 5.5 |
| clocks + pieces + patience 2 | 55% | 3.8 |
| **3.1 as shipped, over 30** | **53.3%** | **5.7** |

The fourth-strut row is the one that shipped. Patience 2 got to an even win rate
by ending matches sooner, which is the wrong way to buy it.

Salvage on its own does nothing measurable: it pays out after a collapse, and
before the pass a collapse was already the end of the match. It is in the 45%
because it is in the build, and it matters more now that a match survives the
collapse it fires on.

Records are filed under a ruleset tag: a hand-set version plus a hash of the
balance numbers a win rate actually depends on. Tightening a number and
re-measuring compares two records instead of dragging an average across the
change and measuring neither. Timing and cosmetic values are deliberately outside
the hash. The training panel can copy a balance report to the clipboard.

## Training options

From the menu, remembered per device. Skip screen texts, skip the round recap,
restart automatically, untimed turns, and go straight into the last thing you
played instead of the menu. The last two are solo only.

With auto-restart on, the end screen drops its Play again button: the next match
deals itself in about a second, and a button that vanishes out from under the
cursor is only there to be pressed by accident. Self-play does the same, for the
same reason.

## Installing it on a phone

The game is installable. On Android and desktop Chrome an Install button appears
on the menu once the browser offers the prompt, and on iOS the same button
points at Share then Add to Home Screen. Installed, it runs fullscreen with the
layout pushed clear of the notch and the home bar.

A service worker precaches the page, the icons and the three libraries during
install, so after the first visit it opens with no connection at all. The page
itself is fetched network-first, so a push still reaches players and the cached
copy is only the offline fallback. Link play is the one thing that still needs a
connection, since it has a second browser on the other end.

## Themes

Four looks over one game: Foundry, Night siege, Blueprint and Amber terminal. A
skin is two tables and nothing else, a set of CSS custom properties for the
interface and a set of colours and light settings for the scene, which is what
makes it safe to switch one mid-match. `T` cycles them.

## Running it locally

The import map means it needs to be served over http rather than opened as a
file.

```
python -m http.server 8000
```

Then open `http://localhost:8000/`. Link play additionally needs the PeerJS
signalling server, so it wants a real network connection.

## What is in the repo

- `index.html` is Tower Siege, the whole thing.
- `manifest.webmanifest`, `sw.js` and the `icon-*` / `favicon` files are what
  make it installable and able to open offline.
- `siege.html` is a redirect left over from when the game lived at that path.
- `stacker.html` is the block stacker this grew out of, physics and a table and
  nothing to fight.
- `tetris.html` is a 3D Tetris built on the same renderer.

## Dependencies

three.js 0.160.0 and cannon-es 0.20.0, loaded from unpkg and jsDelivr through an
import map. PeerJS 1.5.4 is fetched lazily and only if you start a link game.
Fonts come from Google Fonts. Nothing is vendored and there is nothing to
install.

## License

MIT. See [LICENSE](LICENSE).
