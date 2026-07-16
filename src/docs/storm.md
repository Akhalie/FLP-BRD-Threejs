# Flappy Bird 3D — Storm Encounter

> **Goal**
>
> Replace the standard pipe gameplay with a dynamic weather event where the player must survive increasingly dangerous storm conditions. Unlike other encounters, the Storm doesn't introduce a boss—it transforms the environment itself into the primary obstacle by changing the bird's flight behavior and reducing visibility.

---

# Theme

Dark clouds slowly roll across the sky.

Rain begins falling.

Thunder echoes in the distance.

Lightning illuminates the world every few seconds.

The peaceful atmosphere is replaced by a violent storm.

```
☀️

↓

☁☁☁

↓

🌧🌧🌧

↓

⚡
```

The player isn't fighting an enemy.

They're surviving nature itself.

---

# Gameplay Goal

```
Survive

↓

20 Seconds

↓

Storm Clears

↓

Return to Pipes
```

Victory Condition

```
Stay Alive
```

There is no boss health.

There are no enemies.

The weather itself becomes the encounter.

---

# Intro Sequence

```
Checkpoint Reached

↓

Music Slowly Fades

↓

Wind Begins

↓

Clouds Roll In

↓

Rain Starts

↓

Lightning Flashes

↓

WARNING

↓

Storm Begins
```

During this sequence

- Pipe spawning pauses
- Existing pipes leave the screen
- Coins stop spawning
- Ambient lighting darkens
- Fog density increases
- Rain particle system activates

---

# Environment Changes

Normal

```
☀️

Blue Sky

Soft Clouds
```

Storm

```
☁☁☁

🌧🌧🌧

⚡⚡⚡

Dark Fog
```

The encounter should immediately feel different from normal gameplay.

Everything becomes darker, louder, and less predictable.

---

# Storm Controller

Create

```
StormController.js
```

Responsible for

- Rain particles
- Cloud movement
- Wind zones
- Lightning strikes
- Thunder audio
- Fog transitions

This keeps every weather-related mechanic inside one controller.

---

# Storm Behaviour

Unlike the Dragon or UFO...

The Storm has no physical enemy.

Instead, it constantly changes the environment around the player.

```
Storm

↓

Weather Controller

↓

Wind Zones

↓

Lightning

↓

Thunder

↓

Rain

↓

Fog
```

The player is reacting to the world itself instead of a boss.

---

# Wind Zones

Instead of pushing the bird horizontally...

The storm creates localized wind currents that affect the bird's vertical movement.

```
Normal Flight

↓

Wind Zone

↓

Flight Physics Change

↓

Leave Zone

↓

Physics Return
```

This preserves Flappy Bird's one-button gameplay while introducing new movement challenges.

---

# Updraft

Warm air rises into the sky.

```
↑↑↑↑↑

   🐦
```

While flying through an updraft:

- Gravity becomes weaker.
- The bird slowly gains lift.
- Each flap provides more height.

Players can use updrafts to remain airborne longer.

Experienced players can intentionally fly through them.

---

# Downdraft

Cold air crashes downward.

```
↓↓↓↓↓

   🐦
```

Inside a downdraft:

- Gravity becomes stronger.
- The bird falls much faster.
- Flapping becomes less effective.

Players must react quickly to avoid crashing.

---

# Wind Columns

Wind is never applied to the entire screen.

Instead, invisible vertical columns move through the environment.

```
     ↑

████████

     🐦

████████

     ↓
```

Each column contains either:

- Updraft
- Downdraft

The player decides whether to fly through them or avoid them entirely.

---

# Lightning Strike

Lightning never strikes instantly.

Players always receive a warning.

```
⚠

↓

⚡

↓

Impact
```

The warning briefly appears on the ground or in the air before the strike.

Players have enough time to react fairly.

---

# Thunder Shockwave

Some lightning strikes create an expanding shockwave.

```
⚡

((((((((

      🐦
```

The shockwave expands outward.

The player must fly through the opening before it reaches them.

---

# Heavy Rain

Rain is mostly atmospheric.

It does not directly affect gameplay.

Instead it:

- Reduces visibility.
- Makes hazards harder to notice.
- Creates dramatic lighting with lightning flashes.

Rain exists to increase tension rather than difficulty.

---

# Rolling Fog

Large fog banks slowly move across the screen.

```
▒▒▒▒▒▒▒▒▒

      🐦
```

Fog partially hides hazards.

Players must rely on quick reactions instead of long-term planning.

---

# Tornado

Small tornadoes occasionally appear.

```
🌪

↓

🐦
```

Unlike other hazards...

Tornadoes are not always dangerous.

Flying through one launches the bird upward.

```
🌪

↓

BOOST

↓

🐦
```

Players can use tornadoes strategically to avoid hazards above.

However...

Entering at the wrong time may launch the bird directly into lightning or another wind zone.

---

# Encounter Timer

```
20

19

18

17

...

0
```

When the timer reaches zero

The storm begins to clear.

---

# Victory Sequence

```
Rain Stops

↓

Clouds Break Apart

↓

Sunlight Returns

↓

Music Crossfades

↓

Fog Disappears

↓

Pipes Resume
```

The transition should feel calm after surviving the chaos.

---

# Rewards

Completing the encounter grants

- Bonus Score
- Coins
- Rain particle celebration
- Bright sunlight transition
- Victory sound

The reward reinforces surviving the environment rather than defeating an enemy.

---

# Camera Effects

Storm Intro

- Slight zoom out
- Slow camera shake
- Dark exposure adjustment

During Lightning

- Brief white screen flash
- Small impact shake

Storm Outro

- Camera stabilizes
- Brightness returns
- Fog fades smoothly

---

# Audio

Normal Gameplay

```
Retro Theme
```

Storm Encounter

```
Heavy Rain

Rolling Thunder

Strong Wind

Low Ambient Music
```

Lightning should briefly overpower every other sound.

Thunder should arrive slightly after the flash for realism.

---

# HUD Changes

```
SCORE : 58

──────────────

SURVIVE

██████████
```

The encounter timer replaces any boss information.

The HUD remains minimal so the player can focus on the environment.

---

# Optimization

Continue using

- GPU-instanced rain particles
- Shared cloud materials
- Object-pooled lightning effects
- Reusable tornado objects
- Dynamic lighting without excessive shadow calculations

The storm should look visually intense while remaining lightweight enough for mobile devices.

---

# Future Expansion

Possible additions

- Hail Storm
- Ice Wind
- Horizontal Lightning
- Rainbow Bonus Event
- Double Tornado
- Supercell Thunderstorm

These mechanics can expand future weather encounters without changing the core gameplay.

---

# Development Roadmap

## Phase 1

- Storm Controller
- Weather transitions
- Rain particle system

---

## Phase 2

- Wind Zone system
- Updrafts
- Downdrafts

---

## Phase 3

- Lightning strikes
- Thunder shockwaves
- Fog system

---

## Phase 4

- Tornado mechanics
- Camera effects
- Audio transitions

---

## Phase 5

- Environmental polish
- Performance optimization
- Mobile balancing

---

# Design Goal

Unlike every other encounter, the Storm has no visible enemy.

The sky itself becomes the boss.

Players should constantly adapt to changing flight conditions, making split-second decisions about whether to fly through helpful updrafts, avoid dangerous downdrafts, or reposition before lightning strikes. The encounter should feel alive and unpredictable while remaining fair and fully compatible with Flappy Bird's simple one-button control scheme.