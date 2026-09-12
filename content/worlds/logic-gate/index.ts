import type { WorldPack } from "../../registry";
import { world } from "./world";
import thresholdAlarm from "./missions/threshold-alarm";
import badgeCheck from "./missions/badge-check";
import riskScore from "./missions/risk-score";
import truthinessTrap from "./missions/truthiness-trap";
import gateOrder from "./missions/gate-order";
import gateDecisionEngine from "./missions/gate-decision-engine";

export const logicGate: WorldPack = {
  world,
  missions: [thresholdAlarm, badgeCheck, riskScore, truthinessTrap, gateOrder, gateDecisionEngine],
};
