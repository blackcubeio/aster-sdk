// ── Interfaces COMPLÉMENTAIRES Aster (hors contrat commun aux DEX) ─────────────────
// Aster expose beaucoup plus que le tronc commun. Ces interfaces décrivent ces capacités
// **spécifiques** ; elles sont accessibles via le namespace uniforme `dex.native.<capacité>(label?)`
// (cf. convention `native` partagée par les 4 SDK). Lectures **get-préfixées** (`get<Résultat>`),
// écritures = verbes nus, types d'entrée en `…Params`.

import type { getAdlQuantile } from '../rest/futures/account/get-adl-quantile';
import type { getCommissionRate } from '../rest/futures/account/get-commission-rate';
import type { getForceOrders } from '../rest/futures/account/get-force-orders';
import type { getIncome } from '../rest/futures/account/get-income';
import type { getOpenOrder } from '../rest/futures/account/get-open-order';
import type { getPositionMarginHistory } from '../rest/futures/account/get-position-margin-history';
import type { deleteMmp, getMmp, resetMmp, updateMmp } from '../rest/futures/account/mmp';
import type { queryOrder } from '../rest/futures/account/query-order';
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
import type { predictionBurn } from '../rest/prediction/burn';
import type { getPredictionExchangeInfo } from '../rest/prediction/get-exchange-info';
import type { getPredictionPositionHistories } from '../rest/prediction/get-position-histories';
import type { getPredictionPositions } from '../rest/prediction/get-positions';
import type { getPredictionSettlementHistories } from '../rest/prediction/get-settlement-histories';
import type { getPredictionTransactionHistory } from '../rest/prediction/get-transaction-history';
import type { predictionMint } from '../rest/prediction/mint';

/** `params` (2ᵉ arg) d'une fonction REST `fn(client, params, label)`. */
type Args<F extends (...a: never[]) => unknown> = Parameters<F>[1];

// ── Types d'ENTRÉE des ÉCRITURES (suffixe `…Params`, noms alignés inter-SDK) ──────────────
// Découplés des noms REST internes. Les noms partagés (`ApproveAgentParams`, `PlaceBatchParams`,
// `CancelManyParams`, `CreateSubAccountParams`) sont **identiques** sur les autres SDK portant le
// même geste. Les lectures gardent `Args<typeof fn>` en ligne (un type nommé n'apporte rien).
// agents
export type ApproveAgentParams = Args<typeof approveAgent>;
export type RegisterAgentParams = Args<typeof registerAndApproveAgent>;
export type UpdateAgentParams = Args<typeof updateAgent>;
// builders
export type ApproveBuilderParams = Args<typeof approveBuilder>;
export type UpdateBuilderParams = Args<typeof updateBuilder>;
// mmp
export type UpdateMmpParams = Args<typeof updateMmp>;
// modes
export type SetStpModeParams = Args<typeof updateStpMode>;
// orders (`PlaceBatchParams`/`CancelManyParams` partagés)
export type PlaceBatchParams = Args<typeof batchOrders>;
export type CancelManyParams = Args<typeof cancelMultipleOrders>;
export type ChaseParams = Args<typeof chaseOrder>;
export type PlaceStrategyParams = Args<typeof placeStrategyOrder>;
export type EditStrategyParams = Args<typeof updateStrategyOrder>;
// prediction (marchés de prédiction, host papi — testnet-only)
export type PredictionMintParams = Args<typeof predictionMint>;
export type PredictionBurnParams = Args<typeof predictionBurn>;
// subAccounts (`CreateSubAccountParams` partagé)
export type BindSubAccountParams = Args<typeof bindSubAccount>;
export type CreateSubAccountParams = Args<typeof createSubAccount>;
export type UpdateSubAccountParams = Args<typeof updateSubAccount>;

/** Agents (API wallets) : autorisation, listage, mise à jour, révocation. */
export interface IAgents {
  getAgents(): ReturnType<typeof getAgents>;
  approve(params: ApproveAgentParams): ReturnType<typeof approveAgent>;
  register(params: RegisterAgentParams): ReturnType<typeof registerAndApproveAgent>;
  update(params: UpdateAgentParams): ReturnType<typeof updateAgent>;
  revoke(agentAddress: string): ReturnType<typeof deleteAgent>;
}

/** Builders (fee builders) : autorisation, listage, mise à jour, révocation. */
export interface IBuilders {
  getBuilders(): ReturnType<typeof getBuilders>;
  approve(params: ApproveBuilderParams): ReturnType<typeof approveBuilder>;
  update(params: UpdateBuilderParams): ReturnType<typeof updateBuilder>;
  revoke(builder: string): ReturnType<typeof deleteBuilder>;
}

/** Market-maker protection. */
export interface IMmp {
  getConfig(symbol?: string): ReturnType<typeof getMmp>;
  set(params: UpdateMmpParams): ReturnType<typeof updateMmp>;
  reset(symbol: string): ReturnType<typeof resetMmp>;
  remove(symbol: string): ReturnType<typeof deleteMmp>;
}

/** Modes de compte : multi-assets, position (hedge/one-way), self-trade prevention. */
export interface IModes {
  getMultiAssets(): ReturnType<typeof getMultiAssetsMode>;
  setMultiAssets(enabled: boolean): ReturnType<typeof updateMultiAssetsMode>;
  getPosition(): ReturnType<typeof getPositionMode>;
  setPosition(dualSide: boolean): ReturnType<typeof updatePositionMode>;
  getStp(): ReturnType<typeof getStpMode>;
  setStp(mode: SetStpModeParams): ReturnType<typeof updateStpMode>;
}

/** Lectures de compte étendues Aster (ex-`analytics`), portées par `native.account()`. */
export interface INativeAccount {
  getForceOrders(query?: Args<typeof getForceOrders>): ReturnType<typeof getForceOrders>;
  getAdlQuantile(symbol?: string): ReturnType<typeof getAdlQuantile>;
  getCommissionRate(symbol: string): ReturnType<typeof getCommissionRate>;
  getIncome(query?: Args<typeof getIncome>): ReturnType<typeof getIncome>;
  getLeverageBracket(symbol?: string): Promise<unknown>; // surchargée (LeverageBracket | [])
  getMarginHistory(
    query: Args<typeof getPositionMarginHistory>,
  ): ReturnType<typeof getPositionMarginHistory>;
}

/** Données de marché supplémentaires (lectures **publiques**, get-préfixées). */
export interface INativeMarket {
  getAggregateTrades(query: Args<typeof getAggTrades>): ReturnType<typeof getAggTrades>;
  getHistoricalTrades(
    query: Args<typeof getHistoricalTrades>,
  ): ReturnType<typeof getHistoricalTrades>;
  getFundingInfo(symbol?: string): ReturnType<typeof getFundingInfo>;
  getIndexPriceReferences(symbol: string): ReturnType<typeof getIndexPriceReferences>;
  getTicker24hr(symbol?: string): Promise<unknown>; // surchargée (Ticker24hr | Ticker24hr[])
}

/**
 * Surplus **ordres** Aster, porté par le scope marché (`perp()`/`spot()`) : batch, annulation
 * multiple, chase, stratégie (TWAP/VP), lecture par id. Verbes alignés inter-SDK.
 * (`getOpenById` = ordre **ouvert** par id, endpoint `/openOrder` distinct de `getById`.)
 */
export interface INativeOrders {
  placeBatch(orders: PlaceBatchParams): ReturnType<typeof batchOrders>;
  cancelMany(params: CancelManyParams): ReturnType<typeof cancelMultipleOrders>;
  chase(params: ChaseParams): ReturnType<typeof chaseOrder>;
  placeStrategy(params: PlaceStrategyParams): ReturnType<typeof placeStrategyOrder>;
  editStrategy(params: EditStrategyParams): ReturnType<typeof updateStrategyOrder>;
  getStrategies(query: Args<typeof getStrategyOpenOrder>): ReturnType<typeof getStrategyOpenOrder>;
  getStrategyHistory(
    query: Args<typeof getStrategyHistoryOrder>,
  ): ReturnType<typeof getStrategyHistoryOrder>;
  getById(params: Args<typeof queryOrder>): ReturnType<typeof queryOrder>;
  getOpenById(params: Args<typeof getOpenOrder>): ReturnType<typeof getOpenOrder>;
}

/** Marchés de **prédiction** (host `papi`, testnet-only) : infos, positions/historiques, mint/burn. */
export interface IPrediction {
  getExchangeInfo(): ReturnType<typeof getPredictionExchangeInfo>;
  getPositions(
    query?: Args<typeof getPredictionPositions>,
  ): ReturnType<typeof getPredictionPositions>;
  getPositionHistories(
    query?: Args<typeof getPredictionPositionHistories>,
  ): ReturnType<typeof getPredictionPositionHistories>;
  getSettlementHistories(
    query?: Args<typeof getPredictionSettlementHistories>,
  ): ReturnType<typeof getPredictionSettlementHistories>;
  getTransactionHistory(
    query?: Args<typeof getPredictionTransactionHistory>,
  ): ReturnType<typeof getPredictionTransactionHistory>;
  mint(params: PredictionMintParams): ReturnType<typeof predictionMint>;
  burn(params: PredictionBurnParams): ReturnType<typeof predictionBurn>;
}

/**
 * Sous-comptes : liaison, création, mise à jour (la **liste** est dans `account().getSubAccounts()`).
 * Les **transferts** master↔sous-compte sont sur le scope commun `transfers()`.
 */
export interface ISubAccountsAdmin {
  bind(params: BindSubAccountParams): ReturnType<typeof bindSubAccount>;
  create(params: CreateSubAccountParams): ReturnType<typeof createSubAccount>;
  update(params: UpdateSubAccountParams): ReturnType<typeof updateSubAccount>;
}
