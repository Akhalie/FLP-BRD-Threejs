# Flappy Bird 3D — Volcano Encounter

> **Goal**
>
> Replace the standard pipe gameplay with an environmental survival encounter where the player escapes an active volcanic eruption. Unlike the Dragon or UFO encounters, the Volcano itself is the enemy. The player must navigate through an increasingly chaotic landscape filled with lava, fire, and falling debris.

---

# Theme

The peaceful sky suddenly begins to shake.

The horizon glows bright orange.

Smoke rises from distant mountains.

A massive volcano erupts.

```
        🌋

~~~~~~~~~~~~~~~~~~~~~~~~

          🐦
```

The player isn't fighting anything.

They're trying to escape a natural disaster.

---

# Gameplay Goal

```
Survive

↓

25 Seconds

↓

Escape Volcano

↓

Return to Pipes
```

Victory Condition

```
Stay Alive
```

There is no boss.

Only the eruption.

---

# Intro Sequence

```
Checkpoint Reached

↓

Ground Shakes

↓

Camera Vibrates

↓

Music Fades

↓

Smoke Appears

↓

Sky Turns Orange

↓

Volcano Erupts

↓

WARNING

↓

Encounter Begins
```

During the intro

- Pipe spawning pauses
- Existing pipes disappear
- Coins stop spawning
- Fog changes to volcanic ash
- Ambient lighting becomes orange

---

# Environment Changes

Normal

```
☀️

Blue Sky

Clouds
```

Encounter

```
🌋

Smoke

Ash

Fire

Lava Glow
```

The world should feel hot, dangerous, and unstable.

---

# Volcano Controller

Create

```
VolcanoController.js
```

Responsible for

- Lava effects
- Ash particles
- Falling rocks
- Eruptions
- Environmental lighting

---

# Volcano Behaviour

The volcano remains in the background.

```
        🌋

~~~~~~~~~~~~~~~~~~

      🐦
```

Instead of attacking directly...

It continuously creates hazards.

---

# Hazard Controller

```
Volcano

↓

Hazard Controller

↓

Falling Rocks

↓

Lava Bombs

↓

Ash Clouds

↓

Fire Pillars

↓

Lava Wave
```

The Volcano itself never moves.

The environment does.

---

# Falling Rocks

Large volcanic rocks fall from above.

```
🪨

      🪨

🐦

🪨
```

Some fall straight.

Others bounce after impact.

Players constantly reposition.

---

# Lava Bombs

Molten lava launches into the air.

```
🌋

↑

🔥

↓

🐦
```

After reaching the top

They fall back down.

Creates unpredictable arcs.

---

# Fire Pillars

Cracks appear beneath the player.

```
⚠

↓

🔥
```

Seconds later

A pillar of fire erupts upward.

The warning gives players enough time to react.

---

# Lava Wave

A wall of lava rises.

```
██████████

🐦
```

Player must quickly gain altitude.

Unlike Fire Breath...

The lava slowly climbs upward.

---

# Ash Clouds

Ash drifts across the screen.

```
▒▒▒▒▒▒▒▒▒

🐦
```

Visibility becomes limited.

Some hazards become partially hidden.

---

# Heat Distortion

The air shimmers.

Objects slightly distort.

Purely visual.

Adds atmosphere.

---

# Falling Debris

Burning tree trunks

Broken rocks

Charcoal

Fly across the screen.

```
🔥🪵

↓

🐦
```

Creates additional movement hazards.

---

# Earth Tremor

Every few seconds

```
Rumble

↓

Camera Shake

↓

Small Bird Knockback
```

Makes maintaining altitude more difficult.

---

# Encounter Timer

```
25

24

23

...

0
```

Once the timer reaches zero

The eruption calms.

---

# Victory Sequence

```
Ash Clears

↓

Smoke Fades

↓

Lava Stops

↓

Sunlight Returns

↓

Music Changes

↓

Pipes Resume
```

The player escapes the volcanic region.

---

# Rewards

Player receives

- Bonus Score
- Lava Crystal Coins
- Ember particle burst
- Bright orange screen flash
- Victory sound

---

# Difficulty Scaling

## Volcano I

- Falling Rocks
- Ash Clouds

---

## Volcano II

- Lava Bombs
- Fire Pillars

---

## Volcano III

- Lava Waves
- Falling Debris
- Earth Tremors

---

## Volcano IV

Everything Active

- Larger eruptions
- More hazards
- Less visibility
- Faster hazard cycles

---

# Camera Effects

Intro

- Heavy camera shake
- Orange color grading
- Slow zoom out

During eruption

- Random tremors
- Heat distortion

Outro

- Camera stabilizes
- Lighting returns
- Remove distortion

---

# Audio

Normal

```
Retro Theme
```

Encounter

```
Deep Rumbles

Explosions

Falling Rocks

Burning Fire

Lava Sounds
```

Audio should feel powerful and overwhelming.

---

# HUD

```
SCORE : 173

──────────────

ESCAPE

██████████
```

Instead of "SURVIVE"

The HUD emphasizes escaping the eruption.

---

# Optimization

- GPU-instanced ash particles
- Object pooled rocks
- Shared lava materials
- Instanced fire pillars
- No runtime allocations

---

# Future Expansion

Potential mechanics

- Lava Geysers
- Rolling Boulders
- Magma Tornado
- Exploding Crystals
- Collapsing Cliffs
- Lava Dragon (Boss Variant)

---

# Development Roadmap

## Phase 1

- Volcano Controller
- Environment transition
- Ash particle system

---

## Phase 2

- Falling Rocks
- Lava Bomb physics

---

## Phase 3

- Fire Pillars
- Lava Waves

---

## Phase 4

- Earth Tremors
- Falling Debris
- Heat distortion

---

## Phase 5

- Difficulty scaling
- Audio polish
- Camera effects
- Performance optimization

---

# Design Goal

Unlike the Dragon and UFO encounters, the Volcano encounter has no intelligent enemy.

Instead, the environment becomes increasingly hostile.

Players survive by reading environmental cues, reacting to warning indicators, and navigating through a constantly evolving volcanic disaster. The encounter should feel cinematic, chaotic, and completely different from every other gameplay section while remaining faithful to Flappy Bird's simple one-button mechanics.