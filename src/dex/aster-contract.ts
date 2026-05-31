// ── Interfaces COMPLÉMENTAIRES Aster (hors contrat commun aux DEX) ─────────────────
// Aster expose beaucoup plus que le tronc commun. Ces interfaces décrivent ces capacités
// **spécifiques** ; elles sont accessibles via le namespace uniforme `dex.native.<capacité>(label?)`
// (cf. convention `native` partagée par les 4 SDK). Méthodes = verbes normalisés ; types d'I/O
// dérivés des fonctions REST (`Args`/`ReturnType`, zéro divergence).

import type { getAdlQuantile } from '../rest/futures/account/get-adl-quantile';
import type { getCommissionRate } from '../rest/futures/account/get-commission-rate';
import type { getForceOrders } from '../rest/futures/account/get-force-orders';
import type { getIncome } from '../rest/futures/account/get-income';
import type { getOpenOrder } from '../rest/futures/account/get-open-order';
import type { getPositionMarginHistory } from '../rest/futures/account/get-position-margin-history';
import type { deleteMmp, getMmp, resetMmp, updateMmp } from '../rest/futures/account/mmp';
import type { queryOrder } from '../rest/futures/account/query-order';
import type { transferFuturesSpot } from '../rest/futures/account/transfer-futures-spot';
import type {
  approveAgent,
  deleteAgent,
  getAgents,
  updateAgent,
} from '../rest/futures/agent/agents';
import type {
  approveBuilder,
  deleteBuilder,
  getBuilders,
  updateBuilder,
} from '../rest/futures/agent/builders';
import type { registerAndApproveAgent } from '../rest/futures/agent/register-and-approve-agent';
import type { getAggTrades } from '../rest/futures/market/get-agg-trades';
import type { getFundingInfo } from '../rest/futures/market/get-funding-info';
import type { getHistoricalTrades } from '../rest/futures/market/get-historical-trades';
import type { getIndexPriceReferences } from '../rest/futures/market/get-index-price-references';
import type { bindSubAccount } from '../rest/futures/subaccount/bind-sub-account';
import type { createSubAccount } from '../rest/futures/subaccount/create-sub-account';
import type { subAccountTransfer } from '../rest/futures/subaccount/sub-account-transfer';
import type { updateSubAccount } from '../rest/futures/subaccount/update-sub-account';
import type { batchOrders } from '../rest/futures/trade/batch-orders';
import type { cancelMultipleOrders } from '../rest/futures/trade/cancel-multiple-orders';
import type { chaseOrder } from '../rest/futures/trade/chase-order';
import type {
  getMultiAssetsMode,
  updateMultiAssetsMode,
} from '../rest/futures/trade/multi-assets-mode';
import type { getPositionMode, updatePositionMode } from '../rest/futures/trade/position-mode';
import type { getStpMode, updateStpMode } from '../rest/futures/trade/stp-mode';
import type {
  getStrategyHistoryOrder,
  getStrategyOpenOrder,
  placeStrategyOrder,
  updateStrategyOrder,
} from '../rest/futures/trade/strategy-order';

/** `params` (2ᵉ arg) d'une fonction REST `fn(client, params, label)`. */
type Args<F extends (...a: never[]) => unknown> = Parameters<F>[1];

/** Agents (API wallets) : autorisation, listage, mise à jour, révocation. */
export interface IAsterAgents {
  list(): ReturnType<typeof getAgents>;
  approve(params: Args<typeof approveAgent>): ReturnType<typeof approveAgent>;
  register(
    params: Args<typeof registerAndApproveAgent>,
  ): ReturnType<typeof registerAndApproveAgent>;
  update(params: Args<typeof updateAgent>): ReturnType<typeof updateAgent>;
  revoke(agentAddress: string): ReturnType<typeof deleteAgent>;
}

/** Builders (fee builders) : autorisation, listage, mise à jour, révocation. */
export interface IAsterBuilders {
  list(): ReturnType<typeof getBuilders>;
  approve(params: Args<typeof approveBuilder>): ReturnType<typeof approveBuilder>;
  update(params: Args<typeof updateBuilder>): ReturnType<typeof updateBuilder>;
  revoke(builder: string): ReturnType<typeof deleteBuilder>;
}

/** Market-maker protection. */
export interface IAsterMmp {
  get(symbol?: string): ReturnType<typeof getMmp>;
  set(params: Args<typeof updateMmp>): ReturnType<typeof updateMmp>;
  reset(symbol: string): ReturnType<typeof resetMmp>;
  remove(symbol: string): ReturnType<typeof deleteMmp>;
}

/** Modes de compte : multi-assets, position (hedge/one-way), self-trade prevention. */
export interface IAsterModes {
  getMultiAssets(): ReturnType<typeof getMultiAssetsMode>;
  setMultiAssets(enabled: boolean): ReturnType<typeof updateMultiAssetsMode>;
  getPosition(): ReturnType<typeof getPositionMode>;
  setPosition(dualSide: boolean): ReturnType<typeof updatePositionMode>;
  getStp(): ReturnType<typeof getStpMode>;
  setStp(mode: Parameters<typeof updateStpMode>[1]): ReturnType<typeof updateStpMode>;
}

/** Analytics de compte (lectures). */
export interface IAsterAnalytics {
  forceOrders(query?: Args<typeof getForceOrders>): ReturnType<typeof getForceOrders>;
  adlQuantile(symbol?: string): ReturnType<typeof getAdlQuantile>;
  commissionRate(symbol: string): ReturnType<typeof getCommissionRate>;
  income(query?: Args<typeof getIncome>): ReturnType<typeof getIncome>;
  leverageBracket(symbol?: string): Promise<unknown>; // surchargée (LeverageBracket | LeverageBracket[])
  marginHistory(
    query: Args<typeof getPositionMarginHistory>,
  ): ReturnType<typeof getPositionMarginHistory>;
}

/** Données de marché supplémentaires (lectures). */
export interface IAsterMarketData {
  aggTrades(query: Args<typeof getAggTrades>): ReturnType<typeof getAggTrades>;
  historicalTrades(query: Args<typeof getHistoricalTrades>): ReturnType<typeof getHistoricalTrades>;
  fundingInfo(symbol?: string): ReturnType<typeof getFundingInfo>;
  indexPriceReferences(symbol: string): ReturnType<typeof getIndexPriceReferences>;
  ticker24hr(symbol?: string): Promise<unknown>; // surchargée (Ticker24hr | Ticker24hr[])
}

/** Ordres avancés : batch, annulation multiple, chase, stratégie (TWAP/VP), query. */
export interface IAsterAdvancedOrders {
  placeBatch(orders: Args<typeof batchOrders>): ReturnType<typeof batchOrders>;
  cancelMany(params: Args<typeof cancelMultipleOrders>): ReturnType<typeof cancelMultipleOrders>;
  chase(params: Args<typeof chaseOrder>): ReturnType<typeof chaseOrder>;
  placeStrategy(params: Args<typeof placeStrategyOrder>): ReturnType<typeof placeStrategyOrder>;
  updateStrategy(params: Args<typeof updateStrategyOrder>): ReturnType<typeof updateStrategyOrder>;
  strategyOpen(query: Args<typeof getStrategyOpenOrder>): ReturnType<typeof getStrategyOpenOrder>;
  strategyHistory(
    query: Args<typeof getStrategyHistoryOrder>,
  ): ReturnType<typeof getStrategyHistoryOrder>;
  query(params: Args<typeof queryOrder>): ReturnType<typeof queryOrder>;
  getOpen(params: Args<typeof getOpenOrder>): ReturnType<typeof getOpenOrder>;
}

/** Sous-comptes : liaison, création, mise à jour, transferts (la **liste** est dans `account()`). */
export interface IAsterSubAccounts {
  bind(params: Args<typeof bindSubAccount>): ReturnType<typeof bindSubAccount>;
  create(params: Args<typeof createSubAccount>): ReturnType<typeof createSubAccount>;
  update(params: Args<typeof updateSubAccount>): ReturnType<typeof updateSubAccount>;
  transfer(params: Args<typeof subAccountTransfer>): ReturnType<typeof subAccountTransfer>;
  transferFuturesSpot(
    params: Args<typeof transferFuturesSpot>,
  ): ReturnType<typeof transferFuturesSpot>;
}
