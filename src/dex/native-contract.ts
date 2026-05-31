// ── Interfaces COMPLÉMENTAIRES Aster (hors contrat commun aux DEX) ─────────────────
// Aster expose beaucoup plus que le tronc commun. Ces interfaces décrivent ces capacités
// **spécifiques** ; elles sont accessibles via le namespace uniforme `dex.native.<capacité>(label?)`
// (cf. convention `native` partagée par les 4 SDK). Lectures **get-préfixées** (`get<Résultat>`),
// écritures = verbes nus, types d'entrée en `…Params`.

import type {
  AdlQuantile,
  CommissionRate,
  IncomeEntry,
  LeverageBracket,
  PlaceStrategyOrderResult,
  PositionMarginHistoryEntry,
  StrategyType,
  UpdateStrategyOrderResult,
} from '../common/futures';
import type { Order, PlaceOrderParams, Price, Side, Trade } from '../common/types';
import type { ChaseResult, StrategyInfo } from '../converters/strategy';
import type { CancelManyParams } from '../rest/cancel-many';
import type { deleteMmp, getMmp, resetMmp, updateMmp } from '../rest/futures/account/mmp';
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
import type { bindSubAccount } from '../rest/futures/subaccount/bind-sub-account';
import type { createSubAccount } from '../rest/futures/subaccount/create-sub-account';
import type { updateSubAccount } from '../rest/futures/subaccount/update-sub-account';
import type {
  getMultiAssetsMode,
  updateMultiAssetsMode,
} from '../rest/futures/trade/multi-assets-mode';
import type { getPositionMode, updatePositionMode } from '../rest/futures/trade/position-mode';
import type { getStpMode, updateStpMode } from '../rest/futures/trade/stp-mode';
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
// orders : `CancelManyParams` (vocab commun) défini avec son convertisseur, ré-exporté ici.
export type { CancelManyParams } from '../rest/cancel-many';
// sorties dédiées des ordres avancés (interfaces nommées, noms cœur) — ré-exportées.
export type { ChaseResult, StrategyInfo } from '../converters/strategy';
// prediction (marchés de prédiction, host papi — testnet-only)
export type PredictionMintParams = Args<typeof predictionMint>;
export type PredictionBurnParams = Args<typeof predictionBurn>;
// subAccounts (`CreateSubAccountParams` partagé)
export type BindSubAccountParams = Args<typeof bindSubAccount>;
export type CreateSubAccountParams = Args<typeof createSubAccount>;
export type UpdateSubAccountParams = Args<typeof updateSubAccount>;

// ── Entrées NORMALISÉES (vocabulaire commun : `name`, `side:'buy'|'sell'`, dates `YYYY-MM-DD
// HH:MM:SS` UTC, montants/prix en chaîne décimale). Converties en interne (`dateToMs`, BUY/SELL). ──

/** Entrée `getAggregateTrades` — `name` (jamais `symbol`), bornes datetime. */
export interface AggregateTradesParams {
  name: string;
  fromId?: number;
  /** Début (`YYYY-MM-DD HH:MM:SS` UTC). */
  startTime?: string;
  /** Fin (`YYYY-MM-DD HH:MM:SS` UTC). */
  endTime?: string;
  limit?: number;
}

/** Entrée `getHistoricalTrades` — `name` (jamais `symbol`). */
export interface HistoricalTradesParams {
  name: string;
  limit?: number;
  fromId?: number;
}

/** Référence d'un ordre par `id` (orderId) **ou** `clientId` ; `name` requis. */
export interface OrderRefParams {
  name: string;
  id?: string;
  clientId?: string;
}

/** Leg d'une stratégie au vocabulaire commun (`side:'buy'|'sell'`, montants/prix en chaîne). */
export interface StrategyLegParams {
  name: string;
  side: Side;
  type: string;
  size?: string;
  price?: string;
  triggerPrice?: string;
  reduceOnly?: boolean;
  clientId?: string;
  /** Surplus natif d'un sous-ordre (workingType, closePosition, callbackRate…). */
  xtras?: Record<string, unknown>;
}

/** Entrée `placeStrategy` — `legs` au vocabulaire commun (mappés en sous-ordres natifs). */
export interface PlaceStrategyParams {
  strategyType: StrategyType;
  legs: StrategyLegParams[];
  clientId?: string;
}

/** Entrée `editStrategy` — `id` de la stratégie + legs au vocabulaire commun. */
export interface EditStrategyParams {
  id: number;
  strategyType: StrategyType;
  legs: StrategyLegParams[];
}

/** Entrée `getStrategies`/`getStrategyHistory` — `id` xor `clientId`. */
export interface StrategyQueryParams {
  strategyType: StrategyType;
  id?: number;
  clientId?: string;
  /** Début (`YYYY-MM-DD HH:MM:SS` UTC ; historique uniquement). */
  startTime?: string;
  /** Fin (`YYYY-MM-DD HH:MM:SS` UTC ; historique uniquement). */
  endTime?: string;
  limit?: number;
}

/** Entrée `chase` — vocabulaire commun (`name`, `side:'buy'|'sell'`, `size`). */
export interface ChaseParams {
  name: string;
  side: Side;
  size: string;
  /** Unité de quantité (`BASE`/`QUOTE`) ; défaut `BASE`. */
  quantityUnit?: 'BASE' | 'QUOTE';
  reduceOnly?: boolean;
  chaseOffset?: string;
  chaseOffsetType?: 'ABSOLUTE' | 'PERCENTAGE';
  maxChaseOffset?: string;
  maxChaseOffsetType?: 'ABSOLUTE' | 'PERCENTAGE';
  priceLimit?: string;
  tif?: 'gtc' | 'ioc' | 'fok' | 'alo';
  clientId?: string;
}

/** Entrée `getForceOrders` — `name` optionnel, bornes datetime. */
export interface ForceOrdersParams {
  name?: string;
  autoCloseType?: 'LIQUIDATION' | 'ADL';
  /** Début (`YYYY-MM-DD HH:MM:SS` UTC). */
  startTime?: string;
  /** Fin (`YYYY-MM-DD HH:MM:SS` UTC). */
  endTime?: string;
  limit?: number;
}

/** Entrée `getIncome` — `name` optionnel, bornes datetime. */
export interface IncomeParams {
  name?: string;
  incomeType?: string;
  /** Début (`YYYY-MM-DD HH:MM:SS` UTC). */
  startTime?: string;
  /** Fin (`YYYY-MM-DD HH:MM:SS` UTC). */
  endTime?: string;
  limit?: number;
}

/** Entrée `getMarginHistory` — `name` requis, bornes datetime. */
export interface MarginHistoryParams {
  name: string;
  /** `1` = ajout de marge, `2` = retrait. */
  type?: 1 | 2;
  /** Début (`YYYY-MM-DD HH:MM:SS` UTC). */
  startTime?: string;
  /** Fin (`YYYY-MM-DD HH:MM:SS` UTC). */
  endTime?: string;
  limit?: number;
}

/**
 * Configuration de funding d'un marché (intervalle, plafonds). Pas d'équivalent commun
 * (`FundingRate` porte un **taux** historique, pas la **config**) → interface dédiée nommée.
 */
export interface FundingConfig {
  /** Paire/symbole (= `Pair.name`). */
  name: string;
  /** Taux d'intérêt de référence. */
  interestRate: string;
  /** Intervalle de funding (heures). */
  fundingIntervalHours: number;
  /** Plafond du taux. */
  fundingFeeCap: number;
  /** Plancher du taux. */
  fundingFeeFloor: number;
  /** Timestamp (ms). */
  time: number;
}

/** Composante d'un index price (exchange source + poids). */
export interface IndexComponent {
  exchange: string;
  symbol: string;
  weight: string;
}

/** Composition de l'index price d'un marché (sources + poids). Pas d'équivalent commun. */
export interface IndexComposition {
  /** Paire/symbole (= `Pair.name`). */
  name: string;
  /** Timestamp (ms). */
  time: number;
  /** Exchanges sources et poids. */
  components: IndexComponent[];
}

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

/**
 * Lectures de compte étendues Aster (ex-`analytics`), portées par `native.account()`.
 * **I/O normalisés** : entrées en vocabulaire commun (`name`, dates datetime), sorties typées
 * (`Order[]` pour les ordres de liquidation ; interfaces nommées sinon — jamais `unknown`).
 */
export interface INativeAccount {
  /** Ordres de liquidation/ADL du compte → `Order[]` (type commun). */
  getForceOrders(query?: ForceOrdersParams): Promise<Order[]>;
  getAdlQuantile(name?: string): Promise<AdlQuantile[]>;
  getCommissionRate(name: string): Promise<CommissionRate>;
  getIncome(query?: IncomeParams): Promise<IncomeEntry[]>;
  /** Brackets de levier : 1 objet si `name` fourni, sinon la liste complète. */
  getLeverageBracket(name?: string): Promise<LeverageBracket | LeverageBracket[]>;
  getMarginHistory(query: MarginHistoryParams): Promise<PositionMarginHistoryEntry[]>;
}

/**
 * Surplus **perp** Aster spécifique, accès `dex.native.perp(label?)` (miroir natif de `dex.perp()`) :
 * lectures marché supplémentaires (publiques, get-préfixées) **+** ordres avancés (batch/chase/
 * stratégie/lecture par id). **Même discipline d'I/O que le commun** : entrées en vocabulaire
 * commun (`name`/`side`/`size`…), sorties via convertisseurs réutilisant les types communs
 * (`Trade`/`Price`/`Order`) quand le concept existe, sinon interfaces dédiées nommées.
 * (`getOpenById` = ordre **ouvert** par id, endpoint `/openOrder` distinct de `getById`.)
 */
export interface INativePerp {
  // ── lectures marché supplémentaires (publiques ; I/O normalisés) ──
  /** Trades agrégés → `Trade[]` (type commun). */
  getAggregateTrades(query: AggregateTradesParams): Promise<Trade[]>;
  /** Trades historiques → `Trade[]` (type commun). */
  getHistoricalTrades(query: HistoricalTradesParams): Promise<Trade[]>;
  /** Config de funding (intervalle/plafonds) → `FundingConfig[]` (interface dédiée). */
  getFundingInfo(name?: string): Promise<FundingConfig[]>;
  /** Composition de l'index price → `IndexComposition` (interface dédiée). */
  getIndexPriceReferences(name: string): Promise<IndexComposition>;
  /** Stats 24 h → `Price[]` (type commun) ; un seul marché si `name` fourni. */
  getTicker24hr(name?: string): Promise<Price[]>;
  // ── ordres avancés (signés ; I/O normalisés, types communs) ──
  /** Lot d'ordres — entrée `PlaceOrderParams[]` (vocab commun), sortie `Order[]` (1 par leg). */
  placeBatch(orders: PlaceOrderParams[]): Promise<Order[]>;
  /** Annulation multiple — entrée vocab commun, sortie `Order[]` (1 par ordre visé). */
  cancelMany(params: CancelManyParams): Promise<Order[]>;
  /** Ordre chase (peg BBO) → `ChaseResult` (interface dédiée, noms cœur). */
  chase(params: ChaseParams): Promise<ChaseResult>;
  placeStrategy(params: PlaceStrategyParams): Promise<PlaceStrategyOrderResult>;
  editStrategy(params: EditStrategyParams): Promise<UpdateStrategyOrderResult[]>;
  /** Stratégie ouverte → `StrategyInfo` (interface dédiée, noms cœur). */
  getStrategies(query: StrategyQueryParams): Promise<StrategyInfo>;
  /** Stratégie historique → `StrategyInfo` (interface dédiée). */
  getStrategyHistory(query: StrategyQueryParams): Promise<StrategyInfo>;
  /** Statut d'un ordre par `id`/`clientId` → `Order` (type commun). */
  getById(params: OrderRefParams): Promise<Order>;
  /** Ordre **ouvert** par `id`/`clientId` (endpoint `/openOrder`) → `Order`. */
  getOpenById(params: OrderRefParams): Promise<Order>;
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
