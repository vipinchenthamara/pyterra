import type { WorldPack } from "../../registry";
import { world } from "./world";
import rollCall from "./missions/roll-call";
import batterySweep from "./missions/battery-sweep";
import patrolUntil from "./missions/patrol-until";
import skipAndContinue from "./missions/skip-and-continue";
import swarmComprehension from "./missions/swarm-comprehension";
import fleetDispatch from "./missions/fleet-dispatch";

export const droneFleet: WorldPack = {
  world,
  missions: [rollCall, batterySweep, patrolUntil, skipAndContinue, swarmComprehension, fleetDispatch],
};
