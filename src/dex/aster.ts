import { type AsterClient, type InitOptions, init } from '../common/config';
import type {
  AdlQuantile,
  ChaseOrderParams,
  CommissionRate,
  IncomeEntry,
  LeverageBracket,
  PlaceStrategyOrderParams,
  PlaceStrategyOrderResult,
  PositionMarginHistoryEntry,
  StrategySubOrder,
  UpdateStrategyOrderParams,
  UpdateStrategyOrderResult,
} from '../common/futures';
import {
  ChaseOffsetType,
  QuantityUnit,
  SubAccountTransferKind,
  TransferKind,
} from '../common/futures';
import type { WithdrawParams as AsterWithdrawParams, WithdrawResult } from '../common/spot';
import type {
  Balance,
  Candle,
  PlaceOrderParams as CommonPlaceOrderParams,
  FundingRate,
  MarketKind,
  Order,
  OrderBook,
  Pair,
  PlaceProtectionParams,
  Position,
  Price,
  ProtectionTp,
  Side,
  Signer,
  SubAccount,
  Trade,
  UserTrade,
} from '../common/types';
import { OrderSide, OrderType, TimeInForce } from '../common/types';
import type { Hex } from '../common/types';
import { dateToMs } from '../common/utils';
import { AggTradeConverter } from '../converters/agg-trade';
import { OrderConverter } from '../converters/order';
import type { ChaseResult, StrategyInfo } from '../converters/strategy';
import { ChaseConverter, StrategyConverter } from '../converters/strategy';
import { Ticker24hrConverter } from '../converters/ticker';
import { TradeConverter } from '../converters/trade';
import { cancelAllOrders } from '../rest/cancel-all-orders';
import { cancelManyOrders } from '../rest/cancel-many';
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
import { placeBatchOrders } from '../rest/place-batch';
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
  MoveStopParams,
  OrderBookParams,
  PlaceOrderParams,
  SolanaHelper,
  SymbolParams,
  TradesParams,
  TransferParams,
  WithdrawParams,
} from './contract';
import type {
  AggregateTradesParams,
  CancelManyParams,
  ChaseParams,
  EditStrategyParams,
  ForceOrdersParams,
  FundingConfig,
  HistoricalTradesParams,
  IAgents,
  IBuilders,
  IMmp,
  IModes,
  INativeAccount,
  INativePerp,
  IPrediction,
  ISubAccountsAdmin,
  IncomeParams,
  IndexComposition,
  MarginHistoryParams,
  OrderRefParams,
  PlaceStrategyParams,
  StrategyLegParams,
  StrategyQueryParams,
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
    // Un ordre à prix (limit/stop/takeProfit) sans `price` valide serait signé puis rejeté côté
    // serveur (ou pire, placé à 0) : on échoue clairement AVANT l'appel réseau (cf. HL place-order).
    const needsPrice =
      input.type === 'limit' || input.type === 'stop' || input.type === 'takeProfit';
    if (needsPrice === true && (input.price === undefined || input.price === '')) {
      throw new Error(`place (Aster) : \`price\` est requis pour un ordre "${input.type}".`);
    }
    return placeOrder(this.client, { ...input, kind: this.kind }, this.signed());
  }
  public cancel(input: CancelOrderParams): Promise<void> {
    return cancelOrder(this.client, { ...input, kind: this.kind }, this.signed());
  }
  public cancelAll(input: CancelAllParams): Promise<{ cancelled: number | null }> {
    return cancelAllOrders(this.client, { ...input, kind: this.kind }, this.signed());
  }
  // Protection d'une position : SL plein + N TPs partiels, tous reduce-only, posés en un lot
  // (`placeBatch` de conditionnels). `side` = sens de la POSITION → ordres au sens OPPOSÉ. SL =
  // `stopMarket`, TP = `takeProfitMarket` (Aster : conditionnels au prix de déclenchement, sans `price`).
  public placeProtection(input: PlaceProtectionParams): Promise<Order[]> {
    const exit: 'buy' | 'sell' = input.side === 'buy' ? 'sell' : 'buy';
    const legs: CommonPlaceOrderParams[] = [
      {
        name: input.name,
        side: exit,
        type: 'stopMarket',
        triggerPrice: input.sl.triggerPrice,
        size: input.sl.size,
        reduceOnly: true,
      },
      ...input.tps.map(
        (tp: ProtectionTp): CommonPlaceOrderParams => ({
          name: input.name,
          side: exit,
          type: 'takeProfitMarket',
          triggerPrice: tp.triggerPrice,
          size: tp.size,
          reduceOnly: true,
        }),
      ),
    ];
    return placeBatchOrders(this.client, legs, this.signed());
  }
  // Annule toute la protection de la paire (conditionnels reduce-only) avant de la re-poser.
  public cancelProtection(input: { name: string }): Promise<void> {
    return this.cancelAll({ name: input.name }).then(() => undefined);
  }
  // Déplace le SL en posant le NOUVEAU avant d'annuler l'ANCIEN — jamais sans SL (l'API Aster ne modifie en
  // place que les ordres LIMIT, pas les conditionnels). `side` = sens de la position → SL au sens OPPOSÉ ;
  // SL = `stopMarket` reduce-only (déclenché au marché, sans `price`).
  public moveStop(input: MoveStopParams): Promise<{ name: string; id: string }> {
    const exit: 'buy' | 'sell' = input.side === 'buy' ? 'sell' : 'buy';
    return this.place({
      name: input.name,
      side: exit,
      type: 'stopMarket',
      triggerPrice: input.triggerPrice,
      size: input.size,
      reduceOnly: true,
    }).then((order) =>
      this.cancel({ name: input.name, id: input.stopId }).then(() => ({
        name: input.name,
        id: order.id,
      })),
    );
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
  /**
   * Retrait on-chain. Aster **exige** `chainId`, `asset` et `fee` (en plus du `amount` commun) —
   * fournis via le contrat ouvert `WithdrawParams` (`[extra]`). On les valide **avant** l'appel
   * réseau (sinon l'EIP-712 serait signée avec des champs vides → retrait perdu/rejeté côté serveur).
   * `address` = réception (défaut : `user` du signer). Estimer `fee` via `native` / `getWithdrawFeeSpot`.
   */
  public withdraw(input: WithdrawParams): Promise<WithdrawResult> {
    const chainId = input.chainId;
    const asset = input.asset;
    const fee = input.fee;
    if (typeof chainId !== 'string' || chainId === '') {
      throw new Error('withdraw (Aster) : `chainId` (string, ex. "56") est requis.');
    }
    if (typeof asset !== 'string' || asset === '') {
      throw new Error('withdraw (Aster) : `asset` (string) est requis.');
    }
    if (typeof fee !== 'string' || fee === '') {
      throw new Error('withdraw (Aster) : `fee` (string) est requis (cf. getWithdrawFeeSpot).');
    }
    const params: AsterWithdrawParams = {
      amount: input.amount,
      chainId,
      asset,
      fee,
      address: typeof input.address === 'string' ? input.address : undefined,
      destinationChain:
        typeof input.destinationChain === 'string' ? input.destinationChain : undefined,
    };
    return withdraw(this.client, params, this.signed());
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
  // Bougies 1m de tout le marché en UNE souscription : on bucketise le flux de prix agrégé (subscribePrices =
  // !markPrice@arr, poussé en CONTINU pour TOUS les perps) par symbole. close ≈ mark, OHLC échantillonné, volume → 0.
  // (On bâtit sur les prix mark — continus — et non sur !miniTicker@arr qui est change-driven donc sparse sur les paires lentes.)
  public subscribeAllCandles(cb: (c: Candle) => void) {
    const forming = new Map<string, { t: number; o: number; h: number; l: number; c: number }>();
    return this.subscribePrices((prices) => {
      const t = Math.floor(Date.now() / 60_000) * 60_000;
      for (const p of prices) {
        const px = Number(p.mid ?? p.last ?? p.mark ?? p.oracle);
        if (!Number.isFinite(px)) {
          continue;
        }
        let f = forming.get(p.name);
        if (f === undefined || f.t !== t) {
          f = { t, o: px, h: px, l: px, c: px };
          forming.set(p.name, f);
        } else {
          f.h = Math.max(f.h, px);
          f.l = Math.min(f.l, px);
          f.c = px;
        }
        cb({
          t: f.t,
          T: f.t + 60_000,
          s: p.name,
          i: '1m',
          o: String(f.o),
          h: String(f.h),
          l: String(f.l),
          c: String(f.c),
          v: '0',
          n: 0,
          kind: p.kind,
          qv: null,
          tbbv: null,
          tbqv: null,
        });
      }
    });
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
  public getConfig(name?: string) {
    return getMmp(this.client, name, this.signed());
  }
  public set(params: Parameters<typeof updateMmp>[1]) {
    return updateMmp(this.client, params, this.signed());
  }
  public reset(name: string) {
    return resetMmp(this.client, name, this.signed());
  }
  public remove(name: string) {
    return deleteMmp(this.client, name, this.signed());
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

/**
 * Lectures de compte étendues Aster (ex-`analytics`), exposées via `native.account()`.
 * **I/O normalisés** : entrées en vocabulaire commun (`name`, dates datetime UTC), sorties typées
 * (`Order[]` pour les ordres de liquidation ; interfaces nommées sinon).
 */
class AsterAccountExtra extends AsterNativeScope implements INativeAccount {
  public getForceOrders(query?: ForceOrdersParams): Promise<Order[]> {
    const converter = new OrderConverter();
    return getForceOrders(
      this.client,
      {
        symbol: query?.name,
        autoCloseType: query?.autoCloseType,
        startTime: query?.startTime === undefined ? undefined : dateToMs(query.startTime),
        endTime: query?.endTime === undefined ? undefined : dateToMs(query.endTime),
        limit: query?.limit,
      },
      this.signed(),
    ).then((orders) => orders.map((o) => converter.toCommon(o)));
  }
  public getAdlQuantile(name?: string): Promise<AdlQuantile[]> {
    return getAdlQuantile(this.client, name, this.signed());
  }
  public getCommissionRate(name: string): Promise<CommissionRate> {
    return getCommissionRate(this.client, name, this.signed());
  }
  public getIncome(query?: IncomeParams): Promise<IncomeEntry[]> {
    return getIncome(
      this.client,
      {
        symbol: query?.name,
        incomeType: query?.incomeType,
        startTime: query?.startTime === undefined ? undefined : dateToMs(query.startTime),
        endTime: query?.endTime === undefined ? undefined : dateToMs(query.endTime),
        limit: query?.limit,
      },
      this.signed(),
    );
  }
  public getLeverageBracket(name?: string): Promise<LeverageBracket | LeverageBracket[]> {
    return name === undefined
      ? getLeverageBracket(this.client, undefined, this.signed())
      : getLeverageBracket(this.client, name, this.signed());
  }
  public getMarginHistory(query: MarginHistoryParams): Promise<PositionMarginHistoryEntry[]> {
    return getPositionMarginHistory(
      this.client,
      {
        symbol: query.name,
        type: query.type,
        startTime: query.startTime === undefined ? undefined : dateToMs(query.startTime),
        endTime: query.endTime === undefined ? undefined : dateToMs(query.endTime),
        limit: query.limit,
      },
      this.signed(),
    );
  }
}

// ── Maps vocab commun → natif (réutilisées par chase + legs de stratégie) ──
const NATIVE_SIDE: Record<Side, OrderSide> = { buy: OrderSide.Buy, sell: OrderSide.Sell };
const NATIVE_TYPE: Record<string, OrderType> = {
  limit: OrderType.Limit,
  market: OrderType.Market,
  stop: OrderType.Stop,
  stopMarket: OrderType.StopMarket,
  takeProfit: OrderType.TakeProfit,
  takeProfitMarket: OrderType.TakeProfitMarket,
  trailingStop: OrderType.TrailingStopMarket,
};
const NATIVE_TIF: Record<string, TimeInForce> = {
  gtc: TimeInForce.Gtc,
  ioc: TimeInForce.Ioc,
  fok: TimeInForce.Fok,
  alo: TimeInForce.Gtx,
};
const NATIVE_QTY_UNIT: Record<'BASE' | 'QUOTE', QuantityUnit> = {
  BASE: QuantityUnit.Base,
  QUOTE: QuantityUnit.Quote,
};
const NATIVE_OFFSET_TYPE: Record<'ABSOLUTE' | 'PERCENTAGE', ChaseOffsetType> = {
  ABSOLUTE: ChaseOffsetType.Absolute,
  PERCENTAGE: ChaseOffsetType.Percentage,
};

/** Mappe un leg de stratégie (vocab commun) vers le sous-ordre natif `StrategySubOrder`. */
function toStrategySubOrder(leg: StrategyLegParams): StrategySubOrder {
  return {
    strategySubId: (leg.xtras?.strategySubId as string) ?? '',
    securityType: (leg.xtras?.securityType as string) ?? '',
    symbol: leg.name,
    side: NATIVE_SIDE[leg.side],
    type: NATIVE_TYPE[leg.type] ?? OrderType.Limit,
    quantity: leg.size,
    price: leg.price,
    stopPrice: leg.triggerPrice,
    reduceOnly: leg.reduceOnly,
    clientOrderId: leg.clientId,
    ...(leg.xtras ?? {}),
  } as StrategySubOrder;
}

/**
 * Surplus **perp** Aster (miroir natif de `dex.perp()`), accès `dex.native.perp(label?)` :
 * lectures marché supplémentaires (publiques) + ordres avancés (signés). **I/O normalisés** :
 * entrées en vocabulaire commun (`name`/`side`/`size`…), sorties via convertisseurs (`Trade`/
 * `Price`/`Order` quand le concept existe, sinon interface dédiée nommée).
 */
class AsterNativePerp extends AsterNativeScope implements INativePerp {
  // ── lectures marché supplémentaires (publiques ; I/O normalisés) ──
  public getAggregateTrades(query: AggregateTradesParams): Promise<Trade[]> {
    const converter = new AggTradeConverter();
    return getAggTrades(
      this.client,
      {
        symbol: query.name,
        fromId: query.fromId,
        startTime: query.startTime === undefined ? undefined : dateToMs(query.startTime),
        endTime: query.endTime === undefined ? undefined : dateToMs(query.endTime),
        limit: query.limit,
      },
      this.label,
    ).then((trades) => trades.map((t) => converter.toCommon(t)));
  }
  public getHistoricalTrades(query: HistoricalTradesParams): Promise<Trade[]> {
    const converter = new TradeConverter();
    return getHistoricalTrades(
      this.client,
      { symbol: query.name, limit: query.limit, fromId: query.fromId },
      this.label,
    ).then((trades) => trades.map((t) => converter.toCommon(t)));
  }
  public getFundingInfo(name?: string): Promise<FundingConfig[]> {
    return getFundingInfo(this.client, name, this.label).then((rows) =>
      rows.map((r) => ({
        name: r.symbol,
        interestRate: r.interestRate,
        fundingIntervalHours: r.fundingIntervalHours,
        fundingFeeCap: r.fundingFeeCap,
        fundingFeeFloor: r.fundingFeeFloor,
        time: r.time,
      })),
    );
  }
  public getIndexPriceReferences(name: string): Promise<IndexComposition> {
    return getIndexPriceReferences(this.client, name, this.label).then((r) => ({
      name: r.symbol,
      time: r.time,
      components: r.references.map((c) => ({
        exchange: c.exchange,
        symbol: c.symbol,
        weight: c.weight,
      })),
    }));
  }
  public getTicker24hr(name?: string): Promise<Price[]> {
    const converter = new Ticker24hrConverter();
    return name === undefined
      ? getTicker24hr(this.client, undefined, this.label).then((rows) =>
          rows.map((r) => converter.toCommon(r)),
        )
      : getTicker24hr(this.client, name, this.label).then((r) => [converter.toCommon(r)]);
  }
  // ── ordres avancés (signés ; I/O normalisés, types communs) ──
  public placeBatch(orders: CommonPlaceOrderParams[]): Promise<Order[]> {
    return placeBatchOrders(this.client, orders, this.signed());
  }
  public cancelMany(params: CancelManyParams): Promise<Order[]> {
    return cancelManyOrders(this.client, params, this.signed());
  }
  public chase(params: ChaseParams): Promise<ChaseResult> {
    const converter = new ChaseConverter();
    const native: ChaseOrderParams = {
      symbol: params.name,
      side: NATIVE_SIDE[params.side],
      quantityUnit: NATIVE_QTY_UNIT[params.quantityUnit ?? 'BASE'],
      quantity: params.size,
      reduceOnly: params.reduceOnly,
      chaseOffset: params.chaseOffset,
      chaseOffsetType:
        params.chaseOffsetType === undefined
          ? undefined
          : NATIVE_OFFSET_TYPE[params.chaseOffsetType],
      maxChaseOffset: params.maxChaseOffset,
      maxChaseOffsetType:
        params.maxChaseOffsetType === undefined
          ? undefined
          : NATIVE_OFFSET_TYPE[params.maxChaseOffsetType],
      priceLimit: params.priceLimit,
      timeInForce: params.tif === undefined ? undefined : NATIVE_TIF[params.tif],
      clientStrategyId: params.clientId,
    };
    return chaseOrder(this.client, native, this.signed()).then((c) => converter.toCommon(c));
  }
  public placeStrategy(params: PlaceStrategyParams): Promise<PlaceStrategyOrderResult> {
    const native: PlaceStrategyOrderParams = {
      strategyType: params.strategyType,
      subOrderList: params.legs.map(toStrategySubOrder),
      clientStrategyId: params.clientId,
    };
    return placeStrategyOrder(this.client, native, this.signed());
  }
  public editStrategy(params: EditStrategyParams): Promise<UpdateStrategyOrderResult[]> {
    const native: UpdateStrategyOrderParams = {
      strategyId: params.id,
      strategyType: params.strategyType,
      subOrderList: params.legs.map(toStrategySubOrder),
    };
    return updateStrategyOrder(this.client, native, this.signed());
  }
  public getStrategies(query: StrategyQueryParams): Promise<StrategyInfo> {
    const converter = new StrategyConverter();
    return getStrategyOpenOrder(
      this.client,
      { strategyType: query.strategyType, strategyId: query.id, clientStrategyId: query.clientId },
      this.signed(),
    ).then((s) => converter.toCommon(s));
  }
  public getStrategyHistory(query: StrategyQueryParams): Promise<StrategyInfo> {
    const converter = new StrategyConverter();
    return getStrategyHistoryOrder(
      this.client,
      {
        strategyType: query.strategyType,
        strategyId: query.id,
        clientStrategyId: query.clientId,
        startTime: query.startTime === undefined ? undefined : dateToMs(query.startTime),
        endTime: query.endTime === undefined ? undefined : dateToMs(query.endTime),
        limit: query.limit,
      },
      this.signed(),
    ).then((s) => converter.toCommon(s));
  }
  public getById(params: OrderRefParams): Promise<Order> {
    const converter = new OrderConverter();
    return queryOrder(
      this.client,
      {
        symbol: params.name,
        orderId: params.id === undefined ? undefined : Number(params.id),
        origClientOrderId: params.clientId,
      },
      this.signed(),
    ).then((o) => converter.toCommon(o));
  }
  public getOpenById(params: OrderRefParams): Promise<Order> {
    const converter = new OrderConverter();
    return getOpenOrder(
      this.client,
      {
        symbol: params.name,
        orderId: params.id === undefined ? undefined : Number(params.id),
        origClientOrderId: params.clientId,
      },
      this.signed(),
    ).then((o) => converter.toCommon(o));
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
   * Surplus **spécifique Aster**. Le namespace `native` **miroite** le commun : `dex.native.perp()`
   * (reads marché + ordres avancés, miroir de `perp()`), `dex.native.account()` (lectures de compte
   * étendues, ex-analytics, miroir de `account()`) ; + capacités propres `agents`, `builders`, `mmp`,
   * `modes`, `subAccounts`, `prediction`.
   */
  public get native() {
    const resolve = (label?: string) => this.resolve(label);
    return {
      /** Surplus **perp** (miroir natif de perp()) : reads marché + ordres avancés. */
      perp: (label?: string) => new AsterNativePerp(this.client, resolve(label)),
      /** Lectures de compte étendues (ex-analytics, miroir natif de account()). */
      account: (label?: string) => new AsterAccountExtra(this.client, resolve(label)),
      agents: (label?: string) => new AsterAgentsScope(this.client, resolve(label)),
      builders: (label?: string) => new AsterBuildersScope(this.client, resolve(label)),
      mmp: (label?: string) => new AsterMmpScope(this.client, resolve(label)),
      modes: (label?: string) => new AsterModesScope(this.client, resolve(label)),
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
