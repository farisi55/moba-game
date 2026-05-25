// src/main.ts
import { Vector3 } from "three";
import { TIME_CONFIG, UI_CONFIG } from "@/config/constants";
import { HERO_CONFIGS } from "@/config/heroes";
import { eventBus } from "@/core/EventBus";
import { GameEngine } from "@/core/GameEngine";
import { InputManager, type InputAction } from "@/core/InputManager";
import type { AIComponent, MovementComponent } from "@/entities/components";
import { Hero } from "@/entities/Hero";
import { Tower } from "@/entities/Tower";
import { GameMap } from "@/map/GameMap";
import { LaneManager } from "@/map/LaneManager";
import { NetworkStub } from "@/network/NetworkStub";
import { useGameStore } from "@/store/gameStore";
import { AISystem } from "@/systems/AISystem";
import { CombatSystem } from "@/systems/CombatSystem";
import { MovementSystem } from "@/systems/MovementSystem";
import { PlayerInputSystem } from "@/systems/PlayerInputSystem";
import { HUD } from "@/ui/HUD";
import { LobbyScreen } from "@/ui/LobbyScreen";
import { LaneType, Team, type PlayerState, type Vec3 } from "@/types";

const SKILL_KEYS = ["q", "w", "e", "r"] as const;
const PLAYER_NAME = "Guest";

function getElement(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing required element: #${id}`);
  }

  return element;
}

function toVec3(vector: Vector3): Vec3 {
  return {
    x: vector.x,
    y: vector.y,
    z: vector.z
  };
}

function fromVec3(vector: Vec3): Vector3 {
  return new Vector3(vector.x, vector.y, vector.z);
}

const app = getElement("app");
const uiOverlay = getElement("ui-overlay");
const lobbyRoot = getElement("lobby");
const engine = new GameEngine(app);
engine.init();

const gameMap = new GameMap(engine.getScene());
const input = InputManager.getInstance();
input.configure(engine.getRenderer().domElement, engine.getCamera());

const hud = new HUD();
hud.mount(uiOverlay);
const lobby = new LobbyScreen();
lobby.mount(lobbyRoot);
const network = new NetworkStub();
const remoteHeroes = new Map<string, Hero>();
let localHero: Hero | null = null;
let objectivesSpawned = false;

const laneManager = new LaneManager(gameMap, (entity) => engine.addEntity(entity));
engine.addSystem(new PlayerInputSystem(input, () => localHero));
engine.addSystem(new AISystem());
engine.addSystem(new MovementSystem());
engine.addSystem(new CombatSystem());
engine.addSystem(laneManager);

function spawnObjectives(): void {
  if (objectivesSpawned) {
    return;
  }

  objectivesSpawned = true;
  for (const lane of [LaneType.TOP, LaneType.MID, LaneType.BOT]) {
    const blueWaypoint = gameMap.getLaneWaypoints(lane, Team.BLUE)[1];
    const redWaypoint = gameMap.getLaneWaypoints(lane, Team.RED)[1];
    if (blueWaypoint) {
      engine.addEntity(new Tower(Team.BLUE, blueWaypoint));
    }
    if (redWaypoint) {
      engine.addEntity(new Tower(Team.RED, redWaypoint));
    }
  }
}

function createPlayer(id: string, heroId: string, team: Team, name: string, position: Vector3): PlayerState {
  return {
    id,
    heroId,
    team,
    name,
    position: toVec3(position),
    kills: 0,
    deaths: 0,
    connected: true
  };
}

function createHero(heroId: string, team: Team, position: Vector3): Hero {
  const config = HERO_CONFIGS.find((hero) => hero.id === heroId) ?? HERO_CONFIGS[0];
  if (!config) {
    throw new Error("BrowserBrawl requires at least one hero config.");
  }

  return new Hero(config, team, position);
}

function addBotAI(hero: Hero, lane: LaneType): void {
  const waypoints = gameMap.getLaneWaypoints(lane, hero.team);
  hero.addComponent<AIComponent>({
    type: "ai",
    state: "LANE_WALK",
    lane,
    waypoints,
    currentWaypointIndex: 0,
    retreatPosition: gameMap.getSpawnPoint(hero.team)
  });

  const movement = hero.getComponent<MovementComponent>("movement");
  if (movement) {
    movement.targetPosition = waypoints[0]?.clone() ?? null;
  }
}

function useLocalSkill(index: number): void {
  if (!localHero) {
    return;
  }

  const target = input.getMouseWorld();
  const skill = localHero.skills[index];
  if (!skill || !localHero.useSkill(index, target)) {
    return;
  }

  const targetPayload = toVec3(target);
  eventBus.emit("SKILL_USED", {
    heroId: localHero.id,
    skillId: skill.id,
    target: targetPayload
  });
  network.sendSkillUse(skill.id, targetPayload);
}

function handleInput(action: InputAction): void {
  if (!localHero) {
    return;
  }

  if (action.type === "pointer" && action.key === "pointer") {
    const movement = localHero.getComponent<MovementComponent>("movement");
    if (movement) {
      movement.targetPosition = action.worldPosition.clone();
      network.sendPlayerInput({
        sequence: Math.floor(performance.now()),
        moveTarget: toVec3(action.worldPosition),
        pressedKeys: []
      });
    }
  }

  const skillIndex = action.key ? SKILL_KEYS.indexOf(action.key as (typeof SKILL_KEYS)[number]) : -1;
  if (action.type === "keydown" && skillIndex >= 0) {
    useLocalSkill(skillIndex);
  }
}

function startMatch(heroId: string): void {
  spawnObjectives();
  const spawnPoint = gameMap.getSpawnPoint(Team.BLUE);
  localHero = createHero(heroId, Team.BLUE, spawnPoint);
  engine.addEntity(localHero);
  hud.setHero(localHero);

  const localPlayer = createPlayer(localHero.id, heroId, Team.BLUE, PLAYER_NAME, spawnPoint);
  useGameStore.getState().setLocalPlayer(localPlayer);
  useGameStore.getState().setMatchState("IN_GAME");
  lobby.hide();
  engine.start();
  void network.connect(localPlayer);
}

function addRemotePlayer(player: PlayerState): void {
  useGameStore.getState().updatePlayer(player);
  const hero = createHero(player.heroId, player.team, fromVec3(player.position));
  addBotAI(hero, LaneType.MID);
  remoteHeroes.set(player.id, hero);
  engine.addEntity(hero);
}

function updateRemoteMovement(playerId: string, position: Vec3): void {
  const hero = remoteHeroes.get(playerId);
  if (!hero) {
    return;
  }

  const movement = hero.getComponent<MovementComponent>("movement");
  if (movement) {
    movement.targetPosition = fromVec3(position);
  }
}

function updateHud(): void {
  useGameStore.getState().tickTimer(UI_CONFIG.hudRefreshMs / TIME_CONFIG.millisecondsPerSecond);
  const state = useGameStore.getState();
  const localPlayer = state.localPlayer;
  hud.update(state.matchTimer, localPlayer?.kills ?? 0, localPlayer?.deaths ?? 0);
}

input.onAction(handleInput);
hud.onSkill(useLocalSkill);
lobby.onPlay(startMatch);
network.onPlayerJoined(addRemotePlayer);
network.onPlayerMoved(updateRemoteMovement);

eventBus.on("HERO_DIED", (event) => {
  const state = useGameStore.getState();
  const localPlayer = state.localPlayer;
  if (!localPlayer || event.heroId !== localHero?.id) {
    return;
  }

  state.updatePlayer({
    ...localPlayer,
    deaths: localPlayer.deaths + 1
  });
});

eventBus.on("TOWER_DESTROYED", (event) => {
  const state = useGameStore.getState();
  state.setScores({
    blue: event.team === Team.RED ? state.scores.blue + 1 : state.scores.blue,
    red: event.team === Team.BLUE ? state.scores.red + 1 : state.scores.red
  });
});

window.addEventListener("resize", () => {
  engine.resize(window.innerWidth, window.innerHeight);
});

window.setInterval(updateHud, UI_CONFIG.hudRefreshMs);
