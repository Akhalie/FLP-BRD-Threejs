# Power-Ups Mechanics Plan

## Overview
Introduce collectible power-ups to enhance gameplay and add strategic depth. Power-ups can be unlocked through the shop system and customized with cosmetics.

---

## Power-Up Types

### 1. **Shield** 🛡️
**Effect:** Absorbs one collision, then disappears  
**Duration:** Until hit or end of run  
**Visuals:** Glowing aura around bird, translucent force field  
**Mechanics:**
- Bird gains a "shield health" state
- On collision: shield breaks instead of ending game
- Visual feedback: shield flashes red on hit, shatters particle effect
- Can stack (multiple shields = multiple hits)

**Implementation Notes:**
- Add `Bird.shieldActive` boolean or `Bird.shields` counter
- Modify `CollisionSystem` to check shield first before triggering death
- Particle burst on shield break

---

### 2. **Speed Boost** ⚡
**Effect:** Temporarily increases game speed  
**Duration:** 5–8 seconds  
**Visuals:** Speed lines, bird trails, blue glow  
**Mechanics:**
- Multiplies pipe scroll speed (e.g., 1.5x)
- Multiplies bird velocity (slightly, to maintain control feel)
- Multiplies score points earned during boost (1.5x multiplier)
- Audio: rising pitch SFX, looping boost tone

**Implementation Notes:**
- Add `Game.speedBoostMultiplier` (default 1.0)
- Add timer for boost duration
- Update `PipeSpawner` and `Ground` to respect multiplier
- Modify `ScoreSystem` to apply multiplier to points

---

### 3. **Slow-Mo** 🐢
**Effect:** Temporarily slows game time  
**Duration:** 3–5 seconds  
**Visuals:** Blue tint, particle trails, echoing audio  
**Mechanics:**
- Reduces `deltaTime` passed to update loops
- Bird becomes easier to control in narrow gaps
- Score earned at normal rate (no bonus)
- Visual: slight color shift or post-processing effect

**Implementation Notes:**
- Add `Game.timeScale` (default 1.0)
- Modify main game loop: `delta *= Game.timeScale`
- Audio pitch should drop proportionally
- Cancel if another power-up is active

---

### 4. **Magnet** 🧲
**Effect:** Attracts nearby coins automatically  
**Duration:** 8–10 seconds  
**Visuals:** Magnetic field, coins orbit bird  
**Mechanics:**
- All coins within radius (e.g., 15–20 units) move toward bird
- Coins collected automatically on proximity
- Magnetic field pulse animation
- Coins scored at 2x value during magnet active

**Implementation Notes:**
- Add `CoinSystem.magnetActive` and `magnetDuration`
- Modify coin logic: apply force toward bird if magnet active
- Increase coin despawn distance (they can travel farther)
- Visual: glowing particle trail from coins to bird

---

### 5. **Ghost Mode** 👻
**Effect:** Bird becomes temporarily invulnerable  
**Duration:** 4–6 seconds  
**Visuals:** Semi-transparent bird, glowing outline, ethereal particles  
**Mechanics:**
- Pass through pipes and ground without collision
- Cannot collect coins (just ghostly)
- Score frozen during ghost mode
- Audio: eerie synth, muffled environmental sounds

**Implementation Notes:**
- Add `Bird.ghostMode` boolean with timer
- Modify `CollisionSystem` to skip checks if ghost active
- Change bird material opacity or shader
- Disable coin collection logic temporarily

---

### 6. **Double Coins** 💰
**Effect:** All coins earned are doubled in value  
**Duration:** Entire run  
**Visuals:** Gold shimmer on coins, coin counter highlights  
**Mechanics:**
- Permanent multiplier for the current game run
- Stacks with magnet boost (2x × 2x = 4x per coin)
- Visual indicator in HUD: "2x COINS ACTIVE"
- Does not reset on new game (one-time per activation)

**Implementation Notes:**
- Add `ScoreSystem.coinMultiplier` (default 1.0)
- Apply multiplier on coin collection
- Persist multiplier state in `Game` until restart
- Add HUD indicator badge

---

## Power-Up Spawning System

### Spawn Mechanics
- **Frequency:** One power-up per 3–5 pipes (configurable)
- **Spawn Location:** Within pipe gap, slightly offset from center
- **Rarity Weights:** Configure in `CONFIG`
  - Common (40%): Shield, Double Coins
  - Uncommon (35%): Speed Boost, Magnet
  - Rare (20%): Slow-Mo
  - Epic (5%): Ghost Mode

### Visual Representation
```javascript
// Each power-up is a small rotating mesh or sprite
// Animated bob animation (up/down float)
// Glowing material with emit map
// Rotation tied to type (shield spins, coins orbit, etc.)
```

### Implementation Structure
```
src/entities/PowerUp.js
  - class PowerUp
  - type (enum or string)
  - position, velocity
  - lifetime, animation state
  - collision box (for bird pickup)
  - visual mesh with material

src/systems/PowerUpSystem.js
  - spawn(type, position)
  - update(delta)
  - checkCollisions(bird)
  - apply(bird, game)
  - deactivate(type)
  - manage active effects
  - handle duration timers
```

---

## Shop Integration

### Cosmetics for Power-Ups
- **Shield Skins:** Rainbow shield, crystal shield, neon shield
- **Speed Trails:** Flame trail, neon trail, hologram trail
- **Slow-Mo Effects:** Blue tint, cyan glow, time distortion
- **Magnet Auras:** Purple field, blue field, rainbow field
- **Ghost Appearances:** Ethereal, skeleton, shadow

### Unlocking
- Power-ups start locked, must be purchased with coins
- Each power-up = 500 coins (base price)
- Cosmetics = 100–300 coins each
- Persistent via `localStorage`

---

## Configuration

Add to `src/utils/Constants.js`:

```javascript
CONFIG = {
  // ... existing config ...
  
  // Power-Ups
  powerUpSpawnRate: 5,           // spawns per 5 pipes
  powerUpRarityWeights: {
    shield: 0.40,
    speedBoost: 0.20,
    magnet: 0.15,
    slowMo: 0.15,
    ghostMode: 0.07,
    doubleCoins: 0.03,
  },
  
  // Power-Up Durations (seconds)
  powerUpDurations: {
    shield: Infinity,             // until hit
    speedBoost: 6,
    magnet: 9,
    slowMo: 4,
    ghostMode: 5,
    doubleCoins: Infinity,        // one run
  },
  
  // Power-Up Effects
  speedBoostMultiplier: 1.5,
  magnetRadius: 18,
  slowMotimeScale: 0.5,
  coinMagnetValue: 2,             // 2x during magnet
  doubleCoinsMultiplier: 2,
};
```

---

## Event Flow

### Activation
1. Bird collides with power-up mesh
2. `PowerUpSystem` detects collision
3. `Game` emits `powerUpCollected` event with type
4. `AudioManager` plays power-up SFX
5. `ParticleSystem` bursts particle effect
6. `PowerUpSystem.apply()` activates effect
7. `UIManager` displays indicator

### Deactivation (on timer expiry or death)
1. Timer reaches zero (or bird dies)
2. `PowerUpSystem` calls deactivate on active power-ups
3. Bird reverts to normal state
4. Visual/audio effects fade
5. Event emitted for UI cleanup

---

## UI Indicators

### HUD Display (top of screen)
- **Active Power-Up Bar:** Shows timer + icon for active effect
- **Next Power-Up Preview:** When magnet is next (optional)
- **Effect Multiplier Badge:** "2x COINS" / "SPEED UP" / etc.

### Audio Feedback
- **Collect SFX:** Ascending tone + chime
- **Active Loop:** Subtle pulsing sound during effect
- **Expire SFX:** Descending tone on timeout

---

## Balancing Notes

### Score Impact
- **Shield:** No score bonus (defensive)
- **Speed Boost:** Score × 1.5 during active
- **Slow-Mo:** Score × 1.0 (skill-based, no bonus)
- **Magnet:** Coins × 2 (encourages coin hunting)
- **Ghost Mode:** Score frozen (risk-free, no reward)
- **Double Coins:** Coins × 2 (permanent boost)

### Difficulty Curve
- Power-ups should aid but not trivialize runs
- Rare power-ups (Ghost, Slow-Mo) should be game-changers
- Common power-ups (Shield) should feel supportive
- Tune spawn rate based on average run length

### Accessibility
- Visual indicators in addition to sounds
- Colorblind-friendly cosmetics
- Power-up HUD large enough for mobile

---

## Future Enhancements (Phase 6+)

- **Negative Power-Ups:** Reverse effects (speed drain, coin loss) for hardcore mode
- **Power-Up Combos:** Bonus when collecting 2+ types in succession
- **Daily Challenges:** "Use only Ghost Mode" / "Get 10x coins" runs
- **Leaderboards:** Separate boards for modded vs. vanilla runs
- **Custom Power-Ups:** User-defined effects via shop editor

---

## Testing Checklist

- [ ] Each power-up spawns at correct rate
- [ ] Collision detection works for pickups
- [ ] Timers expire correctly
- [ ] Deactivation reverts all state
- [ ] Score multipliers apply correctly
- [ ] HUD indicators display and clear
- [ ] Audio loops/stops properly
- [ ] Particles burst on collect
- [ ] Mobile touch works for power-up zones
- [ ] No conflicts when stacking power-ups
- [ ] Cosmetics load from localStorage
- [ ] Shop purchase/unlock flow works

