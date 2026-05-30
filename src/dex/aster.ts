import { type AsterClient, type InitOptions, init } from '../common/config';
import { MarginType } from '../common/futures';
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
import { cancelAllOrders } from '../rest/cancel-all-orders';
import { cancelOrder } from '../rest/cancel-order';
import { editOrder } from '../rest/edit-order';
import { getAccountInfo } from '../rest/futures/account/get-account-info';
import { getExchangeInfo } from '../rest/futures/market/get-exchange-info';
import { getServerTime } from '../rest/futures/market/get-server-time';
import { ping } from '../rest/futures/market/ping';
import { getSubAccounts } from '../rest/futures/subaccount/get-sub-account-list';
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
import {
  keyTypeOf,
  privateKeyToAddress,
  signEd25519,
  solanaAddress,
  toChecksumAddress,
} from '../rest/signing';
import { getAccountInfoSpot } from '../rest/spot/account/get-account-info';
import { getExchangeInfoSpot } from '../rest/spot/market/get-exchange-info';
import { getServerTimeSpot } from '../rest/spot/market/get-server-time';
import { pingSpot } from '../rest/spot/market/ping';
import { withdraw } from '../rest/spot/withdraw/withdraw';
import { updateLeverage } from '../rest/update-leverage';
import { updateMarginMode } from '../rest/update-margin-mode';
import { UnifiedWsClient } from '../ws/unified-client';
import type {
  CancelAllInput,
  CancelOrderInput,
  CandlesQuery,
  EditOrderInput,
  EvmHelper,
  FundingQuery,
  IAccount,
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
  IsolatedMarginInput,
  KeyHelper,
  LeverageInput,
  MarginModeInput,
  OrderBookQuery,
  PlaceOrderInput,
  SolanaHelper,
  SymbolQuery,
  TradesQuery,
  WithdrawInput,
} from './contract';

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
  public getCandles(query: CandlesQuery): Promise<Candle[]> {
    return getCandles(this.client, { ...query, kind: this.kind }, this.label);
  }
  public getOrderBook(query: OrderBookQuery): Promise<OrderBook> {
    return getOrderBook(this.client, { ...query, kind: this.kind }, this.label);
  }
  public getPrices(): Promise<Price[]> {
    return getPrices(this.client, this.label);
  }
  public getFundingHistory(query: FundingQuery): Promise<FundingRate[]> {
    return getFundingHistory(this.client, query, this.label);
  }
  public getTrades(query: TradesQuery): Promise<Trade[]> {
    return getTrades(this.client, { ...query, kind: this.kind }, this.label);
  }

  // ── IMarketMeta ──
  public getExchangeInfo(): Promise<unknown> {
    return this.spotScope
      ? getExchangeInfoSpot(this.client, this.label)
      : getExchangeInfo(this.client, this.label);
  }

  // ── IProductAccount (compte du produit) ──
  public getPositions(query?: SymbolQuery): Promise<Position[]> {
    // Positions : perp uniquement côté Aster ; le spot n'a pas de positions.
    return getPositions(this.client, { name: query?.name }, this.signed());
  }
  public getOpenOrders(query?: SymbolQuery): Promise<Order[]> {
    return getOpenOrders(this.client, { name: query?.name, kind: this.kind }, this.signed());
  }
  public getUserTrades(query?: SymbolQuery): Promise<UserTrade[]> {
    return getUserTrades(this.client, { name: query?.name, kind: this.kind }, this.signed());
  }
  public getOrderHistory(query?: SymbolQuery): Promise<Order[]> {
    return getOrderHistory(this.client, { name: query?.name }, this.signed());
  }
  public getAccountInfo(): Promise<unknown> {
    return this.spotScope
      ? getAccountInfoSpot(this.client, this.signed())
      : getAccountInfo(this.client, this.signed());
  }

  public placeOrder(input: PlaceOrderInput): Promise<Order> {
    return placeOrder(this.client, { ...input, kind: this.kind }, this.signed());
  }
  public cancelOrder(input: CancelOrderInput): Promise<void> {
    return cancelOrder(this.client, { ...input, kind: this.kind }, this.signed());
  }
  public cancelAllOrders(input: CancelAllInput): Promise<{ cancelled: number | null }> {
    return cancelAllOrders(this.client, { ...input, kind: this.kind }, this.signed());
  }
  public editOrder(input: EditOrderInput): Promise<{ name: string; id: string }> {
    if (input.price === undefined) {
      throw new Error('editOrder (Aster) : `price` est requis.');
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
  public updateLeverage(input: LeverageInput): Promise<unknown> {
    return updateLeverage(this.client, { ...input, kind: this.kind }, this.signed());
  }
  public setMarginMode(input: MarginModeInput): Promise<void> {
    return updateMarginMode(this.client, { ...input, kind: this.kind }, this.signed());
  }
  public addIsolatedMargin(input: IsolatedMarginInput): Promise<void> {
    return updateIsolatedMargin(
      this.client,
      { symbol: input.name, amount: input.amount, type: 1 },
      this.signed(),
    ).then(() => undefined);
  }
  public removeIsolatedMargin(input: IsolatedMarginInput): Promise<void> {
    return updateIsolatedMargin(
      this.client,
      { symbol: input.name, amount: input.amount, type: 2 },
      this.signed(),
    ).then(() => undefined);
  }
}

/** Scope **compte transverse** (sans produit) : soldes, sous-comptes, retrait. */
class AsterAccount implements IAccount, ISubAccounts {
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
  public withdraw(input: WithdrawInput): Promise<unknown> {
    return withdraw(this.client, input as never, this.signed());
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

/**
 * Façade **Aster** : `const dex = new Aster({ deskA: signer }, { default: 'deskA' })`, puis
 * `dex.perp(label?)` / `dex.spot(label?)` (marché), `dex.account(label?)` (compte),
 * `dex.ws(label?)` (temps réel). `label` absent → signer par défaut ; `dex.as(label)` fige le compte.
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
