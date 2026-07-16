import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { StormEncounter } from '../src/encounters/StormEncounter.js';

function makeContext() {
  const scene = {
    children: [],
    add(object) {
      this.children.push(object);
    },
    remove(object) {
      this.children = this.children.filter((child) => child !== object);
    },
  };

  const bird = {
    _position: new THREE.Vector3(0, 0, 0),
    getPosition() {
      return this._position;
    },
    externalGravity: 0,
  };

  return {
    scene,
    bird,
    cameraManager: { shake() {}, setEncounterMode() {} },
    sceneManager: { darkenFog() {}, restoreFog() {}, flashLightning() {} },
    audioManager: { crossfadeToBoss() {}, crossfadeToNormal() {}, playVictory() {} },
    emitter: { emit() {} },
  };
}

test('_onCleanup removes the warning indicator from the scene', () => {
  const context = makeContext();
  const encounter = new StormEncounter(context);

  encounter._onStart();
  assert.ok(context.scene.children.length > 0, 'starting the encounter should add scene objects (clouds, warning indicator)');

  encounter._onCleanup();
  assert.equal(encounter.storm, null, 'cleanup should release the StormController reference');
  assert.equal(context.scene.children.length, 0, 'cleanup should remove every scene object the encounter added');
});

test('checkHit only reports a hit once lightning reaches its STRIKE state, within stormLightningWidth', () => {
  const context = makeContext();
  const encounter = new StormEncounter(context);

  encounter._onStart();
  encounter._onActiveStart(); // enables wind/lightning, same as BaseEncounter entering ACTIVE

  assert.equal(encounter.checkHit(context.bird), false, 'no hit before any lightning has struck');

  const lightning = encounter.storm.lightning;
  lightning.state = 'STRIKE';
  lightning.strikeX = context.bird.getPosition().x;

  assert.equal(encounter.checkHit(context.bird), true, 'bird standing exactly under the strike should be hit');

  context.bird._position.x = lightning.strikeX + 100;
  assert.equal(encounter.checkHit(context.bird), false, 'bird far from the strike x should not be hit');

  encounter._onCleanup();
});

test('checkHit is false before the encounter has started', () => {
  const context = makeContext();
  const encounter = new StormEncounter(context);

  assert.equal(encounter.checkHit(context.bird), false, 'no StormController exists yet, so there is nothing to hit');
});
