import type { WorldPack } from "../registry";
import { foundationDistrict } from "./foundation-district";
import { dataVault } from "./data-vault";
import { previewWorlds } from "./previews";

/** Ordered list of every world pack. Add a new authored world here. */
export const worldPacks: WorldPack[] = [foundationDistrict, dataVault, ...previewWorlds];
