# Flappy Bird 3D — UFO Encounter

> **Goal**
>
> Replace the standard pipe gameplay with a fast-paced alien invasion where the player survives advanced technology, laser attacks, and robotic enemies. Unlike the Dragon encounter, the UFO relies on precision and futuristic weapons instead of brute force.

---

# Theme

Without warning...

The sky grows silent.

Stars begin appearing in daylight.

A strange green light fills the screen.

An enormous UFO slowly descends.

```
       🛸

-------------------------

       🐦
```

Instead of flying through pipes...

The player enters an alien invasion.

---

# Gameplay Goal

```
Survive

↓

25 Seconds

↓

Mother Ship Leaves

↓

Return to Pipes
```

Victory condition

```
Stay Alive
```

The UFO cannot be defeated.

The player simply survives its assault.

---

# Intro Sequence

```
Checkpoint Reached

↓

Music Distorts

↓

Sky Darkens

↓

Stars Fade In

↓

Green Lights Sweep Screen

↓

WARNING

↓

UFO Descends

↓

Encounter Begins
```

During this sequence

- Pipe spawning pauses
- Existing pipes leave screen
- Coins disappear
- Ambient lighting becomes blue/green
- Strange electronic ambience begins

---

# Environment Changes

Normal

```
☀️

Clouds

Blue Sky
```

Encounter

```
⭐ ⭐ ⭐

Nebula

Green Lighting

Electronic Fog
```

The entire atmosphere should feel unnatural.

---

# UFO Behavior

Unlike the Dragon...

The UFO does not chase the player.

Instead it patrols the top of the screen.

```
←────────→

      🛸
```

It slowly moves left and right while deploying attacks.

---

# Alien AI

The UFO constantly evaluates the player's position.

```
Bird Position

↓

Target Prediction

↓

Select Attack

↓

Execute
```

Attacks are semi-random to avoid becoming predictable.

---

# Attack Controller

```
UFO

↓

Attack Controller

↓

Laser

↓

Drone Swarm

↓

Tractor Beam

↓

Energy Mines

↓

EMP Pulse
```

Only one major attack occurs at a time.

---

# Laser Beam

The UFO charges its weapon.

```
🛸

✨

↓

━━━━━━
```

Players receive a warning before the laser fires.

Laser duration

```
1.5 seconds
```

Difficulty increases by

- Faster charge
- Wider beam
- Sweeping beam

---

# Drone Swarm

Small drones deploy from underneath the UFO.

```
🛸

▼ ▼ ▼

↓

🐦
```

Drones move independently.

Some fly straight.

Others zig-zag.

---

# Tractor Beam

The UFO projects a vertical beam.

```
🛸

████

↓

🐦
```

Bird movement changes.

Gravity weakens.

The bird slowly floats upward.

Player must compensate.

---

# Energy Mines

Floating alien mines appear.

```
○

    ○

🐦

       ○
```

After several seconds

```
⚡

Explosion
```

They disappear after exploding.

---

# EMP Pulse

The UFO emits an expanding energy wave.

```
🛸

((((((

🐦
```

Player flies through the expanding gap.

---

# Hologram Decoys

Higher difficulty.

The UFO creates fake copies.

```
🛸 🛸 🛸

Only one is real.
```

Only the real UFO attacks.

---

# Gravity Shift

Rare event.

Gravity reverses briefly.

```
↓

Normal

↑

Reverse

↓

Normal
```

The player must quickly adapt.

---

# Encounter Timer

```
25

24

23

...

0
```

When time expires

The invasion ends.

---

# Victory Sequence

```
Lasers Stop

↓

UFO Ascends

↓

Sky Returns

↓

Music Fades

↓

Pipes Resume
```

---

# Rewards

Player receives

- Bonus Score
- Alien Coins
- Neon particle burst
- Screen flash
- Sci-fi victory sound

---

# Difficulty Scaling

## UFO I

- Laser only

---

## UFO II

- Lasers
- Drone Swarms

---

## UFO III

- Tractor Beam
- Energy Mines

---

## UFO IV

Everything active

- Faster attacks
- Less downtime
- Gravity shifts
- Fake UFO projections

---

# Camera Effects

Intro

- Slight zoom out
- Green screen tint
- Light camera vibration

During lasers

- Small camera shake

Outro

- Smooth transition back
- Remove visual effects

---

# Audio

Normal

```
Retro Theme
```

Encounter

```
Synth Ambience

Electronic Pulses

Deep Bass

Alien Sound Effects
```

Every attack has unique audio cues.

---

# HUD

```
SCORE : 124

──────────────

SURVIVE

██████████
```

A glowing neon HUD replaces the standard color palette.

---

# Optimization

- Pool all drones
- Pool energy mines
- Shared laser materials
- GPU-instanced particles
- No runtime allocations

---

# Future Expansion

Potential mechanics

- Black Hole
- Plasma Cannon
- Missile Pods
- Satellite Strike
- Wormhole Portal
- Alien Boss Ship

---

# Development Roadmap

## Phase 1

- UFO Entity
- Hover movement
- Intro sequence

---

## Phase 2

- Laser attack
- Charge effects

---

## Phase 3

- Drone AI
- Energy mines

---

## Phase 4

- Tractor Beam
- EMP Pulse

---

## Phase 5

- Difficulty scaling
- Audio polish
- Camera effects
- Optimization

---

# Design Goal

Unlike the Dragon encounter, which pressures the player with a single massive enemy, the UFO encounter focuses on advanced technology, precision attacks, and battlefield control.

The player should constantly react to lasers, drones, and changing gravity, making the encounter feel closer to an arcade bullet-hell while still preserving Flappy Bird's simple one-button gameplay.