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
import type { predictionBurn } from '../rest/prediction/burn';
import type { getPredictionExchangeInfo } from '../rest/prediction/get-exchange-info';
import type { getPredictionPositionHistories } from '../rest/prediction/get-position-histories';
import type { getPredictionPositions } from '../rest/prediction/get-positions';
import type { getPredictionSettlementHistories } from '../rest/prediction/get-settlement-histories';
import type { getPredictionTransactionHistory } from '../rest/prediction/get-transaction-history';
import type { predictionMint } from '../rest/prediction/mint';

/** `params` (2ᵉ arg) d'une fonction REST `fn(client, params, label)`. */
type Args<F extends (...a: never[]) => unknown> = Parameters<F>[1];

// ── Types d'ENTRÉE des ÉCRITURES (noms de concept propres, alignés inter-SDK) ──────────────
// Découplés des noms REST internes (le nom public reste stable si l'endpoint change). Les noms
// partagés (`ApproveAgent`, `PlaceBatch`, `CancelMany`, `CreateSubAccount`, `TransferSubAccount`)
// sont **identiques** sur les autres SDK portant le même geste ; les noms spécifiques Aster restent
// descriptifs (« similaires »). Les lectures gardent `Args<typeof fn>` en ligne (un type nommé pour
// un filtre de lecture n'apporte rien).
// agents (`ApproveAgent` partagé)
export type ApproveAgent = Args<typeof approveAgent>;
export type RegisterAgent = Args<typeof registerAndApproveAgent>;
export type UpdateAgent = Args<typeof updateAgent>;
// builders
export type ApproveBuilder = Args<typeof approveBuilder>;
export type UpdateBuilder = Args<typeof updateBuilder>;
// mmp
export type UpdateMmp = Args<typeof updateMmp>;
// modes
export type SetStpMode = Args<typeof updateStpMode>;
// advancedOrders (`PlaceBatch`/`CancelMany` partagés)
export type PlaceBatch = Args<typeof batchOrders>;
export type CancelMany = Args<typeof cancelMultipleOrders>;
export type Chase = Args<typeof chaseOrder>;
export type PlaceStrategy = Args<typeof placeStrategyOrder>;
export type UpdateStrategy = Args<typeof updateStrategyOrder>;
// prediction (marchés de prédiction, host papi — testnet-only)
export type PredictionMint = Args<typeof predictionMint>;
export type PredictionBurn = Args<typeof predictionBurn>;
// subAccounts (`CreateSubAccount`/`TransferSubAccount` partagés)
export type BindSubAccount = Args<typeof bindSubAccount>;
export type CreateSubAccount = Args<typeof createSubAccount>;
export type UpdateSubAccount = Args<typeof updateSubAccount>;
export type TransferSubAccount = Args<typeof subAccountTransfer>;
export type TransferFuturesSpot = Args<typeof transferFuturesSpot>;

/** Agents (API wallets) : autorisation, listage, mise à jour, révocation. */
export interface IAgents {
  list(): ReturnType<typeof getAgents>;
  approve(params: ApproveAgent): ReturnType<typeof approveAgent>;
  register(params: RegisterAgent): ReturnType<typeof registerAndApproveAgent>;
  update(params: UpdateAgent): ReturnType<typeof updateAgent>;
  revoke(agentAddress: string): ReturnType<typeof deleteAgent>;
}

/** Builders (fee builders) : autorisation, listage, mise à jour, révocation. */
export interface IBuilders {
  list(): ReturnType<typeof getBuilders>;
  approve(params: ApproveBuilder): ReturnType<typeof approveBuilder>;
  update(params: UpdateBuilder): ReturnType<typeof updateBuilder>;
  revoke(builder: string): ReturnType<typeof deleteBuilder>;
}

/** Market-maker protection. */
export interface IMmp {
  get(symbol?: string): ReturnType<typeof getMmp>;
  set(params: UpdateMmp): ReturnType<typeof updateMmp>;
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
  setStp(mode: SetStpMode): ReturnType<typeof updateStpMode>;
}

/** Analytics de compte (lectures). */
export interface IAnalytics {
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
export interface INativeMarket {
  aggTrades(query: Args<typeof getAggTrades>): ReturnType<typeof getAggTrades>;
  historicalTrades(query: Args<typeof getHistoricalTrades>): ReturnType<typeof getHistoricalTrades>;
  fundingInfo(symbol?: string): ReturnType<typeof getFundingInfo>;
  indexPriceReferences(symbol: string): ReturnType<typeof getIndexPriceReferences>;
  ticker24hr(symbol?: string): Promise<unknown>; // surchargée (Ticker24hr | Ticker24hr[])
}

/** Ordres avancés : batch, annulation multiple, chase, stratégie (TWAP/VP), query. */
export interface IAdvancedOrders {
  placeBatch(orders: PlaceBatch): ReturnType<typeof batchOrders>;
  cancelMany(params: CancelMany): ReturnType<typeof cancelMultipleOrders>;
  chase(params: Chase): ReturnType<typeof chaseOrder>;
  placeStrategy(params: PlaceStrategy): ReturnType<typeof placeStrategyOrder>;
  updateStrategy(params: UpdateStrategy): ReturnType<typeof updateStrategyOrder>;
  strategyOpen(query: Args<typeof getStrategyOpenOrder>): ReturnType<typeof getStrategyOpenOrder>;
  strategyHistory(
    query: Args<typeof getStrategyHistoryOrder>,
  ): ReturnType<typeof getStrategyHistoryOrder>;
  query(params: Args<typeof queryOrder>): ReturnType<typeof queryOrder>;
  getOpen(params: Args<typeof getOpenOrder>): ReturnType<typeof getOpenOrder>;
}

/** Marchés de **prédiction** (host `papi`, testnet-only) : infos, positions/historiques, mint/burn. */
export interface IPrediction {
  exchangeInfo(): ReturnType<typeof getPredictionExchangeInfo>;
  positions(query?: Args<typeof getPredictionPositions>): ReturnType<typeof getPredictionPositions>;
  positionHistories(
    query?: Args<typeof getPredictionPositionHistories>,
  ): ReturnType<typeof getPredictionPositionHistories>;
  settlementHistories(
    query?: Args<typeof getPredictionSettlementHistories>,
  ): ReturnType<typeof getPredictionSettlementHistories>;
  transactionHistory(
    query?: Args<typeof getPredictionTransactionHistory>,
  ): ReturnType<typeof getPredictionTransactionHistory>;
  mint(params: PredictionMint): ReturnType<typeof predictionMint>;
  burn(params: PredictionBurn): ReturnType<typeof predictionBurn>;
}

/** Sous-comptes : liaison, création, mise à jour, transferts (la **liste** est dans `account()`). */
export interface ISubAccountsAdmin {
  bind(params: BindSubAccount): ReturnType<typeof bindSubAccount>;
  create(params: CreateSubAccount): ReturnType<typeof createSubAccount>;
  update(params: UpdateSubAccount): ReturnType<typeof updateSubAccount>;
  transfer(params: TransferSubAccount): ReturnType<typeof subAccountTransfer>;
  transferFuturesSpot(params: TransferFuturesSpot): ReturnType<typeof transferFuturesSpot>;
}
