import { type AsterClient, type InitOptions, init } from '../common/config';
import { SubAccountTransferKind, TransferKind } from '../common/futures';
import type {
  Balance,
  Candle,
  FundingRate,
  MarketKind,
  Order,
  OrderBook,
  Pair,
  Position,
  Price,
  Signer,
  SubAccount,
  Trade,
  UserTrade,
} from '../common/types';
import type { Hex } from '../common/types';
import { dateToMs } from '../common/utils';
import { cancelAllOrders } from '../rest/cancel-all-orders';
import { cancelOrder } from '../rest/cancel-order';
import { editOrder } from '../rest/edit-order';
import { getAccountInfo } from '../rest/futures/account/get-account-info';
// ── Surplus spécifique Aster (namespace native) ──
import { getAdlQuantile } from '../rest/futures/account/get-adl-quantile';
import { getCommissionRate } from '../rest/futures/account/get-commission-rate';
import { getForceOrders } from '../rest/futures/account/get-force-orders';
import { getIncome } from '../rest/futures/account/get-income';
import { getLeverageBracket } from '../rest/futures/account/get-leverage-bracket';
import { getOpenOrder } from '../rest/futures/account/get-open-order';
import { getPositionMarginHistory } from '../rest/futures/account/get-position-margin-history';
import { deleteMmp, getMmp, resetMmp, updateMmp } from '../rest/futures/account/mmp';
import { queryOrder } from '../rest/futures/account/query-order';
import { transferFuturesSpot } from '../rest/futures/account/transfer-futures-spot';
import { approveAgent, deleteAgent, getAgents, updateAgent } from '../rest/futures/agent/agents';
import {
  approveBuilder,
  deleteBuilder,
  getBuilders,
  updateBuilder,
} from '../rest/futures/agent/builders';
import { registerAndApproveAgent } from '../rest/futures/agent/register-and-approve-agent';
import { getAggTrades } from '../rest/futures/market/get-agg-trades';
import { getExchangeInfo } from '../rest/futures/market/get-exchange-info';
import { getFundingInfo } from '../rest/futures/market/get-funding-info';
import { getHistoricalTrades } from '../rest/futures/market/get-historical-trades';
import { getIndexPriceReferences } from '../rest/futures/market/get-index-price-references';
import { getServerTime } from '../rest/futures/market/get-server-time';
import { getTicker24hr } from '../rest/futures/market/get-ticker-24hr';
import { ping } from '../rest/futures/market/ping';
import { bindSubAccount } from '../rest/futures/subaccount/bind-sub-account';
import { createSubAccount } from '../rest/futures/subaccount/create-sub-account';
import { getSubAccounts } from '../rest/futures/subaccount/get-sub-account-list';
import { subAccountTransfer } from '../rest/futures/subaccount/sub-account-transfer';
import { updateSubAccount } from '../rest/futures/subaccount/update-sub-account';
import { batchOrders } from '../rest/futures/trade/batch-orders';
import { cancelMultipleOrders } from '../rest/futures/trade/cancel-multiple-orders';
import { chaseOrder } from '../rest/futures/trade/chase-order';
import { countdownCancelAll } from '../rest/futures/trade/countdown-cancel-all';
import { getMultiAssetsMode, updateMultiAssetsMode } from '../rest/futures/trade/multi-assets-mode';
import { getPositionMode, updatePositionMode } from '../rest/futures/trade/position-mode';
import { getStpMode, updateStpMode } from '../rest/futures/trade/stp-mode';
import {
  getStrategyHistoryOrder,
  getStrategyOpenOrder,
  placeStrategyOrder,
  updateStrategyOrder,
} from '../rest/futures/trade/strategy-order';
import { updateIsolatedMargin } from '../rest/futures/trade/update-isolated-margin';
import { getBalances } from '../rest/get-balances';
import { getCandles } from '../rest/get-candles';
import { getFundingHistory } from '../rest/get-funding-history';
import { getOpenOrders } from '../rest/get-open-orders';
import { getOrderBook } from '../rest/get-order-book';
import { getOrderHistory } from '../rest/get-order-history';
import { getPairs } from '../rest/get-pairs';
import { getPositions } from '../rest/get-positions';
import { getPrices } from '../rest/get-prices';
import { getTrades } from '../rest/get-trades';
import { getUserTrades } from '../rest/get-user-trades';
import { placeOrder } from '../rest/place-order';
import { predictionBurn } from '../rest/prediction/burn';
import { getPredictionExchangeInfo } from '../rest/prediction/get-exchange-info';
import { getPredictionPositionHistories } from '../rest/prediction/get-position-histories';
import { getPredictionPositions } from '../rest/prediction/get-positions';
import { getPredictionSettlementHistories } from '../rest/prediction/get-settlement-histories';
import { getPredictionTransactionHistory } from '../rest/prediction/get-transaction-history';
import { predictionMint } from '../rest/prediction/mint';
import {
  keyTypeOf,
  privateKeyToAddress,
  signEd25519,
  solanaAddress,
  toChecksumAddress,
} from '../rest/signing';
import { getAccountInfoSpot } from '../rest/spot/account/get-account-info';
import { getExchangeInfoSpot } from '../rest/spot/market/get-exchange-info';
import { withdraw } from '../rest/spot/withdraw/withdraw';
import { updateLeverage } from '../rest/update-leverage';
import { updateMarginMode } from '../rest/update-margin-mode';
import { UnifiedWsClient } from '../ws/unified-client';
import type {
  CancelAllParams,
  CancelOrderParams,
  CandlesParams,
  EditOrderParams,
  EvmHelper,
  FundingParams,
  IAccount,
  IDeadManSwitch,
  IIsolatedMargin,
  IMarginMode,
  IMarketData,
  IMarketMeta,
  IOrderHistory,
  IProductAccount,
  IPublicTrades,
  IRealtime,
  IRealtimePositions,
  IRemovableMargin,
  ISubAccounts,
  ISystem,
  ITrading,
  ITransfers,
  IsolatedMarginParams,
  KeyHelper,
  LeverageParams,
  MarginModeParams,
  OrderBookParams,
  PlaceOrderParams,
  SolanaHelper,
  SymbolParams,
  TradesParams,
  TransferParams,
  WithdrawParams,
} from './contract';
import type {
  IAgents,
  IBuilders,
  IMmp,
  IModes,
  INativeAccount,
  INativeMarket,
  INativeOrders,
  IPrediction,
  ISubAccountsAdmin,
} from './native-contract';

/** Options de construction d'un {@link Aster}. */
export interface AsterDexOptions extends Omit<InitOptions, 'signers'> {
  /** Label du signer par défaut (sinon le 1er du registre). */
  default?: string;
}

/**
 * Scope **marché** (perp ou spot) lié à un `kind` et un `label`. Les params n'ont pas de
 * `kind` : il est porté par le scope. Implémente toutes les capacités marché d'Aster.
 */
class AsterMarket
  implements
    IMarketData,
    IMarketMeta,
    IProductAccount,
    IOrderHistory,
    IPublicTrades,
    ITrading,
    INativeOrders,
    IMarginMode,
    IIsolatedMargin,
    IRemovableMargin
{
  private get spotScope(): boolean {
    return this.kind === 'spot';
  }

  constructor(
    private readonly client: AsterClient,
    private readonly kind: MarketKind,
    private readonly label: string | undefined,
  ) {}

  private signed(): string {
    if (this.label === undefined) {
      throw new Error('Action signée : aucun signer (ajoute des signers ou un défaut).');
    }
    return this.label;
  }

  public getPairs(): Promise<Pair[]> {
    return getPairs(this.client, this.label).then((pairs) =>
      pairs.filter((pair) => pair.kind === this.kind),
    );
  }
  public getCandles(query: CandlesParams): Promise<Candle[]> {
    return getCandles(
      this.client,
      {
        ...query,
        kind: this.kind,
        startTime: query.startTime === undefined ? undefined : dateToMs(query.startTime),
        endTime: query.endTime === undefined ? undefined : dateToMs(query.endTime),
      },
      this.label,
    );
  }
  public getOrderBook(query: OrderBookParams): Promise<OrderBook> {
    return getOrderBook(this.client, { ...query, kind: this.kind }, this.label);
  }
  public getPrices(): Promise<Price[]> {
    return getPrices(this.client, this.label);
  }
  public getFundingHistory(query: FundingParams): Promise<FundingRate[]> {
    return getFundingHistory(
      this.client,
      {
        ...query,
        startTime: query.startTime === undefined ? undefined : dateToMs(query.startTime),
        endTime: query.endTime === undefined ? undefined : dateToMs(query.endTime),
      },
      this.label,
    );
  }
  public getTrades(query: TradesParams): Promise<Trade[]> {
    return getTrades(this.client, { ...query, kind: this.kind }, this.label);
  }

  // ── IMarketMeta ──
  public getExchangeInfo(): Promise<unknown> {
    return this.spotScope
      ? getExchangeInfoSpot(this.client, this.label)
      : getExchangeInfo(this.client, this.label);
  }

  // ── IProductAccount (compte du produit) ──
  public getPositions(query?: SymbolParams): Promise<Position[]> {
    // Positions : perp uniquement côté Aster ; le spot n'a pas de positions.
    return getPositions(this.client, { name: query?.name }, this.signed());
  }
  public getOpens(query?: SymbolParams): Promise<Order[]> {
    return getOpenOrders(this.client, { name: query?.name, kind: this.kind }, this.signed());
  }
  public getUserTrades(query?: SymbolParams): Promise<UserTrade[]> {
    return getUserTrades(this.client, { name: query?.name, kind: this.kind }, this.signed());
  }
  public getHistory(query?: SymbolParams): Promise<Order[]> {
    return getOrderHistory(this.client, { name: query?.name }, this.signed());
  }
  public getAccountInfo(): Promise<unknown> {
    return this.spotScope
      ? getAccountInfoSpot(this.client, this.signed())
      : getAccountInfo(this.client, this.signed());
  }

  public place(input: PlaceOrderParams): Promise<Order> {
    return placeOrder(this.client, { ...input, kind: this.kind }, this.signed());
  }
  public cancel(input: CancelOrderParams): Promise<void> {
    return cancelOrder(this.client, { ...input, kind: this.kind }, this.signed());
  }
  public cancelAll(input: CancelAllParams): Promise<{ cancelled: number | null }> {
    return cancelAllOrders(this.client, { ...input, kind: this.kind }, this.signed());
  }
  public edit(input: EditOrderParams): Promise<{ name: string; id: string }> {
    if (input.price === undefined) {
      throw new Error('edit (Aster) : `price` est requis.');
    }
    return editOrder(
      this.client,
      {
        name: input.name,
        id: input.id,
        clientId: input.clientId,
        size: input.size,
        price: input.price,
        kind: this.kind,
      },
      this.signed(),
    );
  }
  public updateLeverage(input: LeverageParams): Promise<unknown> {
    return updateLeverage(this.client, { ...input, kind: this.kind }, this.signed());
  }
  public setMarginMode(input: MarginModeParams): Promise<void> {
    return updateMarginMode(this.client, { ...input, kind: this.kind }, this.signed());
  }
  public addIsolatedMargin(input: IsolatedMarginParams): Promise<void> {
    return updateIsolatedMargin(
      this.client,
      { symbol: input.name, amount: input.amount, type: 1 },
      this.signed(),
    ).then(() => undefined);
  }
  public removeIsolatedMargin(input: IsolatedMarginParams): Promise<void> {
    return updateIsolatedMargin(
      this.client,
      { symbol: input.name, amount: input.amount, type: 2 },
      this.signed(),
    ).then(() => undefined);
  }

  // ── INativeOrders : surplus ordres Aster porté par le scope marché ──
  public placeBatch(orders: Parameters<typeof batchOrders>[1]) {
    return batchOrders(this.client, orders, this.signed());
  }
  public cancelMany(params: Parameters<typeof cancelMultipleOrders>[1]) {
    return cancelMultipleOrders(this.client, params, this.signed());
  }
  public chase(params: Parameters<typeof chaseOrder>[1]) {
    return chaseOrder(this.client, params, this.signed());
  }
  public placeStrategy(params: Parameters<typeof placeStrategyOrder>[1]) {
    return placeStrategyOrder(this.client, params, this.signed());
  }
  public editStrategy(params: Parameters<typeof updateStrategyOrder>[1]) {
    return updateStrategyOrder(this.client, params, this.signed());
  }
  public getStrategies(query: Parameters<typeof getStrategyOpenOrder>[1]) {
    return getStrategyOpenOrder(this.client, query, this.signed());
  }
  public getStrategyHistory(query: Parameters<typeof getStrategyHistoryOrder>[1]) {
    return getStrategyHistoryOrder(this.client, query, this.signed());
  }
  public getById(params: Parameters<typeof queryOrder>[1]) {
    return queryOrder(this.client, params, this.signed());
  }
  public getOpenById(params: Parameters<typeof getOpenOrder>[1]) {
    return getOpenOrder(this.client, params, this.signed());
  }
}

/** Scope **compte transverse** (sans produit) : soldes, sous-comptes, retrait. */
class AsterAccount implements IAccount, ISubAccounts, IDeadManSwitch {
  constructor(
    private readonly client: AsterClient,
    private readonly label: string | undefined,
  ) {}

  private signed(): string {
    if (this.label === undefined) {
      throw new Error('Action signée : aucun signer (ajoute des signers ou un défaut).');
    }
    return this.label;
  }

  public getBalances(): Promise<Balance[]> {
    return getBalances(this.client, {}, this.signed());
  }
  public getSubAccounts(): Promise<SubAccount[]> {
    return getSubAccounts(this.client, this.signed());
  }
  public withdraw(input: WithdrawParams): Promise<unknown> {
    return withdraw(this.client, input as never, this.signed());
  }

  // ── IDeadManSwitch ──
  // Aster : `countdownCancelAll` est **par symbole** (durée relative ms, 0 désarme). On arme/désarme
  // chaque marché perp ayant des ordres ouverts (le heartbeat re-couvre les nouveaux symboles).
  private async openPerpSymbols(): Promise<string[]> {
    const orders = await getOpenOrders(this.client, { kind: 'perp' }, this.signed());
    return [...new Set(orders.map((o) => o.name))];
  }
  public async armCancelAll(afterMs: number): Promise<unknown> {
    const symbols = await this.openPerpSymbols();
    return Promise.all(
      symbols.map((symbol) =>
        countdownCancelAll(this.client, { symbol, countdownTime: afterMs }, this.signed()),
      ),
    );
  }
  public async disarm(): Promise<unknown> {
    const symbols = await this.openPerpSymbols();
    return Promise.all(
      symbols.map((symbol) =>
        countdownCancelAll(this.client, { symbol, countdownTime: 0 }, this.signed()),
      ),
    );
  }
}

/** Scope **système** : connectivité et horloge serveur (perp par défaut). */
class AsterSystem implements ISystem {
  constructor(private readonly client: AsterClient) {}

  public ping(): Promise<void> {
    return ping(this.client);
  }
  public getServerTime(): Promise<number> {
    return getServerTime(this.client).then((r) => r.serverTime);
  }
}

/** Helpers crypto Aster : EVM **et** Solana (Aster signe les deux familles de clés). */
class AsterHelpers implements KeyHelper, EvmHelper, SolanaHelper {
  public keyTypeOf(privateKey: string): 'evm' | 'solana' {
    return keyTypeOf(privateKey);
  }
  public privateKeyToAddress(privateKey: string): string {
    return privateKeyToAddress(privateKey as Hex);
  }
  public toChecksumAddress(address: string): string {
    return toChecksumAddress(address);
  }
  public solanaAddress(privateKey: string): string {
    return solanaAddress(privateKey);
  }
  public signEd25519(msg: string, privateKey: string): string {
    return signEd25519(msg, privateKey);
  }
}

/** Scope **temps réel** lié à un `label`. `kind` porté par les méthodes spot/perp (via `ws.spot`/`ws.perp`). */
class AsterRealtime implements IRealtime, IRealtimePositions {
  constructor(
    private readonly ws: UnifiedWsClient,
    private readonly kind: MarketKind,
  ) {}

  public subscribeCandles(query: { name: string; interval: string }, cb: (c: Candle) => void) {
    return this.ws.subscribeCandles({ ...query, kind: this.kind }, cb);
  }
  public subscribeOrderBook(query: { name: string }, cb: (b: OrderBook) => void) {
    return this.ws.subscribeOrderBook({ ...query, kind: this.kind }, cb);
  }
  public subscribeTrades(query: { name: string }, cb: (t: Trade) => void) {
    return this.ws.subscribeTrades({ ...query, kind: this.kind }, cb);
  }
  public subscribeBbo(query: { name: string }, cb: (b: OrderBook) => void) {
    return this.ws.subscribeBbo({ ...query, kind: this.kind }, cb);
  }
  public subscribePrices(cb: (p: Price[]) => void) {
    return this.ws.subscribePrices(cb);
  }
  public subscribeOrders(cb: (o: Order) => void) {
    return this.ws.subscribeOrders({}, cb);
  }
  public subscribeUserTrades(cb: (t: UserTrade) => void) {
    return this.ws.subscribeUserTrades({}, cb);
  }
  public subscribePositions(cb: (p: Position) => void) {
    return this.ws.subscribePositions({}, cb);
  }
}

// ── Surplus spécifique Aster (namespace `native`, convention partagée par les 4 SDK) ──

/** Base des scopes `native` : résolution du label (lectures privées via `signed()`). */
class AsterNativeScope {
  constructor(
    protected readonly client: AsterClient,
    protected readonly label: string | undefined,
  ) {}

  protected signed(): string {
    if (this.label === undefined) {
      throw new Error('Action signée : aucun signer (ajoute des signers ou un défaut).');
    }
    return this.label;
  }
}

class AsterAgentsScope extends AsterNativeScope implements IAgents {
  public getAgents() {
    return getAgents(this.client, this.signed());
  }
  public approve(params: Parameters<typeof approveAgent>[1]) {
    return approveAgent(this.client, params, this.signed());
  }
  public register(params: Parameters<typeof registerAndApproveAgent>[1]) {
    return registerAndApproveAgent(this.client, params, this.signed());
  }
  public update(params: Parameters<typeof updateAgent>[1]) {
    return updateAgent(this.client, params, this.signed());
  }
  public revoke(agentAddress: string) {
    return deleteAgent(this.client, agentAddress, this.signed());
  }
}

class AsterBuildersScope extends AsterNativeScope implements IBuilders {
  public getBuilders() {
    return getBuilders(this.client, this.signed());
  }
  public approve(params: Parameters<typeof approveBuilder>[1]) {
    return approveBuilder(this.client, params, this.signed());
  }
  public update(params: Parameters<typeof updateBuilder>[1]) {
    return updateBuilder(this.client, params, this.signed());
  }
  public revoke(builder: string) {
    return deleteBuilder(this.client, builder, this.signed());
  }
}

class AsterMmpScope extends AsterNativeScope implements IMmp {
  public getConfig(symbol?: string) {
    return getMmp(this.client, symbol, this.signed());
  }
  public set(params: Parameters<typeof updateMmp>[1]) {
    return updateMmp(this.client, params, this.signed());
  }
  public reset(symbol: string) {
    return resetMmp(this.client, symbol, this.signed());
  }
  public remove(symbol: string) {
    return deleteMmp(this.client, symbol, this.signed());
  }
}

class AsterModesScope extends AsterNativeScope implements IModes {
  public getMultiAssets() {
    return getMultiAssetsMode(this.client, this.signed());
  }
  public setMultiAssets(enabled: boolean) {
    return updateMultiAssetsMode(this.client, enabled, this.signed());
  }
  public getPosition() {
    return getPositionMode(this.client, this.signed());
  }
  public setPosition(dualSide: boolean) {
    return updatePositionMode(this.client, dualSide, this.signed());
  }
  public getStp() {
    return getStpMode(this.client, this.signed());
  }
  public setStp(mode: Parameters<typeof updateStpMode>[1]) {
    return updateStpMode(this.client, mode, this.signed());
  }
}

/** Lectures de compte étendues Aster (ex-`analytics`), exposées via `native.account()`. */
class AsterAccountExtra extends AsterNativeScope implements INativeAccount {
  public getForceOrders(query?: Parameters<typeof getForceOrders>[1]) {
    return getForceOrders(this.client, query, this.signed());
  }
  public getAdlQuantile(symbol?: string) {
    return getAdlQuantile(this.client, symbol, this.signed());
  }
  public getCommissionRate(symbol: string) {
    return getCommissionRate(this.client, symbol, this.signed());
  }
  public getIncome(query?: Parameters<typeof getIncome>[1]) {
    return getIncome(this.client, query, this.signed());
  }
  public getLeverageBracket(symbol?: string) {
    return symbol === undefined
      ? getLeverageBracket(this.client, undefined, this.signed())
      : getLeverageBracket(this.client, symbol, this.signed());
  }
  public getMarginHistory(query: Parameters<typeof getPositionMarginHistory>[1]) {
    return getPositionMarginHistory(this.client, query, this.signed());
  }
}

/** Données de marché supplémentaires : **publiques** (label optionnel). */
class AsterMarketDataScope extends AsterNativeScope implements INativeMarket {
  public getAggregateTrades(query: Parameters<typeof getAggTrades>[1]) {
    return getAggTrades(this.client, query, this.label);
  }
  public getHistoricalTrades(query: Parameters<typeof getHistoricalTrades>[1]) {
    return getHistoricalTrades(this.client, query, this.label);
  }
  public getFundingInfo(symbol?: string) {
    return getFundingInfo(this.client, symbol, this.label);
  }
  public getIndexPriceReferences(symbol: string) {
    return getIndexPriceReferences(this.client, symbol, this.label);
  }
  public getTicker24hr(symbol?: string) {
    return symbol === undefined
      ? getTicker24hr(this.client, undefined, this.label)
      : getTicker24hr(this.client, symbol, this.label);
  }
}

class AsterSubAccountsScope extends AsterNativeScope implements ISubAccountsAdmin {
  public bind(params: Parameters<typeof bindSubAccount>[1]) {
    return bindSubAccount(this.client, params, this.signed());
  }
  public create(params: Parameters<typeof createSubAccount>[1]) {
    return createSubAccount(this.client, params, this.signed());
  }
  public update(params: Parameters<typeof updateSubAccount>[1]) {
    return updateSubAccount(this.client, params, this.signed());
  }
}

/** Marchés de **prédiction** (host `papi`, testnet-only). `exchangeInfo` public ; le reste signé. */
class AsterPredictionScope extends AsterNativeScope implements IPrediction {
  public getExchangeInfo() {
    return getPredictionExchangeInfo(this.client, this.label);
  }
  public getPositions(query: Parameters<typeof getPredictionPositions>[1] = {}) {
    return getPredictionPositions(this.client, query, this.signed());
  }
  public getPositionHistories(query: Parameters<typeof getPredictionPositionHistories>[1] = {}) {
    return getPredictionPositionHistories(this.client, query, this.signed());
  }
  public getSettlementHistories(
    query: Parameters<typeof getPredictionSettlementHistories>[1] = {},
  ) {
    return getPredictionSettlementHistories(this.client, query, this.signed());
  }
  public getTransactionHistory(query: Parameters<typeof getPredictionTransactionHistory>[1] = {}) {
    return getPredictionTransactionHistory(this.client, query, this.signed());
  }
  public mint(params: Parameters<typeof predictionMint>[1]) {
    return predictionMint(this.client, params, this.signed());
  }
  public burn(params: Parameters<typeof predictionBurn>[1]) {
    return predictionBurn(this.client, params, this.signed());
  }
}

/**
 * Scope **transferts** unifié (commun aux 4 SDK). Route le modèle abstrait
 * `transfer({ from?, to, asset?, amount })` vers les endpoints Aster :
 * - `wallet ↔ wallet` (perp↔spot) → `transferFuturesSpot` ;
 * - `to: { subAccount }` → `subAccountTransfer` (master↔sous-compte) ;
 * - `to: { account }` → non supporté (Aster n'a pas d'envoi externe générique).
 */
class AsterTransfers extends AsterNativeScope implements ITransfers {
  public transfer(p: TransferParams) {
    const asset = p.asset ?? 'USDT';
    if ('subAccount' in p.to) {
      return subAccountTransfer(
        this.client,
        {
          toAccountAddress: p.to.subAccount,
          asset,
          amount: p.amount,
          kindType: SubAccountTransferKind.FuturesToFutures,
          ...(p.from !== undefined && 'subAccount' in p.from
            ? { fromAccountAddress: p.from.subAccount }
            : {}),
        },
        this.signed(),
      );
    }
    if ('wallet' in p.to && p.from !== undefined && 'wallet' in p.from) {
      const kindType =
        p.from.wallet === 'spot' ? TransferKind.SpotToFutures : TransferKind.FuturesToSpot;
      return transferFuturesSpot(
        this.client,
        { asset, amount: p.amount, clientTranId: `aster-${Date.now()}`, kindType },
        this.signed(),
      );
    }
    throw new Error(
      'transfer : Aster supporte `wallet ↔ wallet` (perp↔spot) et `to: { subAccount }` ; pas `to: { account }`.',
    );
  }
}

/**
 * Façade **Aster** : `const dex = new Aster({ deskA: signer }, { default: 'deskA' })`, puis
 * `dex.perp(label?)` / `dex.spot(label?)` (marché), `dex.account(label?)` (compte),
 * `dex.ws(label?)` (temps réel), `dex.native.<capacité>(label?)` (surplus spécifique Aster).
 * `label` absent → signer par défaut.
 *
 * Chaque instance détient son propre {@link AsterClient} (config isolée) : plusieurs `Aster`
 * (comptes/réseaux différents) coexistent sans état global partagé.
 */
export class Aster {
  private readonly client: AsterClient;
  private readonly defaultLabel: string | undefined;
  private wsClients = new Map<string, UnifiedWsClient>();

  constructor(signers: Record<string, Signer> = {}, options: AsterDexOptions = {}) {
    const { default: defaultLabel, ...init0 } = options;
    this.client = init({ ...init0, signers });
    this.defaultLabel = defaultLabel ?? Object.keys(signers)[0];
  }

  private resolve(label?: string): string | undefined {
    return label ?? this.defaultLabel;
  }

  /** Scope marché **perp**. */
  public perp(label?: string): AsterMarket {
    return new AsterMarket(this.client, 'perp', this.resolve(label));
  }

  /** Scope marché **spot**. */
  public spot(label?: string): AsterMarket {
    return new AsterMarket(this.client, 'spot', this.resolve(label));
  }

  /** Scope **compte** transverse (soldes, sous-comptes, retrait). */
  public account(label?: string): AsterAccount {
    return new AsterAccount(this.client, this.resolve(label));
  }

  /** Scope **transferts** unifié (perp↔spot, master↔sous-compte). */
  public transfers(label?: string): AsterTransfers {
    return new AsterTransfers(this.client, this.resolve(label));
  }

  /** Scope **système** (connectivité, horloge serveur). */
  public system(): AsterSystem {
    return new AsterSystem(this.client);
  }

  /** Helpers crypto (EVM + Solana). */
  public helpers(): AsterHelpers {
    return new AsterHelpers();
  }

  /** Scope **temps réel** perp (cf. {@link wsSpot} pour le spot). */
  public ws(label?: string): AsterRealtime {
    return new AsterRealtime(this.unifiedWs(this.resolve(label)), 'perp');
  }

  /** Scope **temps réel** spot. */
  public wsSpot(label?: string): AsterRealtime {
    return new AsterRealtime(this.unifiedWs(this.resolve(label)), 'spot');
  }

  /**
   * Surplus **spécifique Aster** (hors contrat commun), accès uniforme `dex.native.<capacité>(label?)` :
   * `agents`, `builders`, `mmp`, `modes`, `account` (ex-analytics), `marketData`, `subAccounts`,
   * `prediction`. (Le surplus **ordres** est porté par `perp()`/`spot()`.)
   */
  public get native() {
    const resolve = (label?: string) => this.resolve(label);
    return {
      agents: (label?: string) => new AsterAgentsScope(this.client, resolve(label)),
      builders: (label?: string) => new AsterBuildersScope(this.client, resolve(label)),
      mmp: (label?: string) => new AsterMmpScope(this.client, resolve(label)),
      modes: (label?: string) => new AsterModesScope(this.client, resolve(label)),
      account: (label?: string) => new AsterAccountExtra(this.client, resolve(label)),
      marketData: (label?: string) => new AsterMarketDataScope(this.client, resolve(label)),
      subAccounts: (label?: string) => new AsterSubAccountsScope(this.client, resolve(label)),
      /** Marchés de prédiction (testnet-only). */
      prediction: (label?: string) => new AsterPredictionScope(this.client, resolve(label)),
    };
  }

  /** Un client WS unifié par label (réutilisé pour partager le ref-counting des sockets). */
  private unifiedWs(label: string | undefined): UnifiedWsClient {
    const key = label ?? '';
    let ws = this.wsClients.get(key);
    if (ws === undefined) {
      ws = new UnifiedWsClient(this.client, label);
      this.wsClients.set(key, ws);
    }
    return ws;
  }
}
