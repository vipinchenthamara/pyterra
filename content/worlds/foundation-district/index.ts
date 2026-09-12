import type { WorldPack } from "../../registry";
import { world } from "./world";
import powerOn from "./missions/power-on";
import capacityMath from "./missions/capacity-math";
import identityBadge from "./missions/identity-badge";
import signalParsing from "./missions/signal-parsing";
import typeBoundary from "./missions/type-boundary";
import districtStatusReport from "./missions/district-status-report";

export const foundationDistrict: WorldPack = {
  world,
  missions: [powerOn, capacityMath, identityBadge, signalParsing, typeBoundary, districtStatusReport],
};
