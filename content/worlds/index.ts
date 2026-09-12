import type { WorldPack } from "../registry";
import { foundationDistrict } from "./foundation-district";
import { dataVault } from "./data-vault";
import { logicGate } from "./logic-gate";
import { droneFleet } from "./drone-fleet";
import { automationFactory } from "./automation-factory";
import { previewWorlds } from "./previews";

/** Ordered list of every world pack. Add a new authored world here. */
export const worldPacks: WorldPack[] = [foundationDistrict, dataVault, logicGate, droneFleet, automationFactory, ...previewWorlds];
