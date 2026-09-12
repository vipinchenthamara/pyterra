import type { WorldPack } from "../../registry";
import { world } from "./world";
import firstMachine from "./missions/first-machine";
import parametersAndDefaults from "./missions/parameters-and-defaults";
import scopeIncident from "./missions/scope-incident";
import returnContracts from "./missions/return-contracts";
import composeMachines from "./missions/compose-machines";
import automationPipeline from "./missions/automation-pipeline";

export const automationFactory: WorldPack = {
  world,
  missions: [firstMachine, parametersAndDefaults, scopeIncident, returnContracts, composeMachines, automationPipeline],
};
