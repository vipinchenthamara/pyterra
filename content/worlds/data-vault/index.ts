import type { WorldPack } from "../../registry";
import { world } from "./world";
import storeInventory from "./missions/store-inventory";
import duplicateIncident from "./missions/duplicate-incident";
import buildLookupLogic from "./missions/build-lookup-logic";
import immutableCoordinates from "./missions/immutable-coordinates";
import vaultQuery from "./missions/vault-query";
import theCorruptedArchive from "./missions/the-corrupted-archive";

export const dataVault: WorldPack = {
  world,
  missions: [storeInventory, duplicateIncident, buildLookupLogic, immutableCoordinates, vaultQuery, theCorruptedArchive],
};
