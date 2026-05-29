import type {
  KlineInterval,
  MarketKind,
  OrderSide,
  OrderStatus,
  OrderType,
  TimeInForce,
} from '../../common/types';

// ── Exchange information ──────────────────────────────────────────────────────

export interface SpotRateLimit {
  rateLimitType: string;
  interval: string;
  intervalNum: number;
  limit: number;
}

export interface SpotFilter {
  filterType: string;
  [key: string]: unknown;
}

export interface SpotSymbol {
  symbol: string;
  status: string;
  baseAsset: string;
  quoteAsset: string;
  pricePrecision: number;
  quantityPrecision: number;
  baseAssetPrecision: number;
  quotePrecision: number;
  ocoAllowed: boolean;
  filters: SpotFilter[];
  orderTypes: string[];
  timeInForce: string[];
  /** Toujours `'spot'` ici — distingue des perpetuals lors d'une fusion. */
  kind: MarketKind;
}

export interface SpotExchangeInfo {
  timezone: string;
  serverTime: number;
  rateLimits: SpotRateLimit[];
  exchangeFilters: unknown[];
  assets: { asset: string }[];
  symbols: SpotSymbol[];
}

export interface SpotServerTime {
  serverTime: number;
}

// ── Market data ───────────────────────────────────────────────────────────────

export interface SpotPriceLevel {
  price: string;
  qty: string;
}

export interface SpotOrderBook {
  lastUpdateId: number;
  eventTime: number;
  transactionTime: number;
  bids: SpotPriceLevel[];
  asks: SpotPriceLevel[];
}

export interface SpotTrade {
  id: number;
  price: string;
  qty: string;
  baseQty: string;
  time: number;
  isBuyerMaker: boolean;
}

export interface SpotAggTrade {
  aggTradeId: number;
  price: string;
  quantity: string;
  firstTradeId: number;
  lastTradeId: number;
  timestamp: number;
  isBuyerMaker: boolean;
}

/** Bougie OHLCV au **format unifié Blackcube** (cf. `Kline` futures). Toujours `kind: 'spot'`. */
export interface SpotKline {
  /** Open time — début de la bougie (timestamp ms). */
  t: number;
  /** Close time — fin de la bougie (timestamp ms). */
  T: number;
  /** Symbol — paire (ex. `ASTERUSDT`). */
  s: string;
  /** Interval — intervalle (ex. `1h`). */
  i: string;
  /** Open — prix d'ouverture. */
  o: string;
  /** Close — prix de clôture. */
  c: string;
  /** High — plus haut. */
  h: string;
  /** Low — plus bas. */
  l: string;
  /** Volume — volume en actif de base. */
  v: string;
  /** Number of trades — nombre de trades. */
  n: number;
  /** Type de marché — toujours `'spot'`. */
  kind: MarketKind;
  /** Quote volume — volume en actif de cotation. */
  qv: string;
  /** Taker buy base volume — volume acheteur (taker) en base. */
  tbbv: string;
  /** Taker buy quote volume — volume acheteur (taker) en cotation. */
  tbqv: string;
}

export interface SpotTicker24hr {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  lastQty: string;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
  baseAsset: string;
  quoteAsset: string;
}

export interface SpotPriceTicker {
  symbol: string;
  price: string;
  time: number;
}

export interface SpotBookTicker {
  symbol: string;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
  time: number;
}

export interface SpotCommissionRate {
  symbol: string;
  makerCommissionRate: string;
  takerCommissionRate: string;
}

export interface SpotDepthQuery {
  symbol: string;
  limit?: number;
}

export interface SpotTradesQuery {
  symbol: string;
  limit?: number;
}

export interface SpotHistoricalTradesQuery {
  symbol: string;
  limit?: number;
  fromId?: number;
}

export interface SpotAggTradesQuery {
  symbol: string;
  fromId?: number;
  startTime?: number;
  endTime?: number;
  limit?: number;
}

export interface SpotKlinesQuery {
  symbol: string;
  interval: KlineInterval;
  startTime?: number;
  endTime?: number;
  limit?: number;
}

// ── Trading & account ─────────────────────────────────────────────────────────

export interface SpotNewOrderParams {
  symbol: string;
  side: OrderSide;
  type: OrderType;
  timeInForce?: TimeInForce;
  quantity?: string;
  quoteOrderQty?: string;
  price?: string;
  newClientOrderId?: string;
  stopPrice?: string;
}

export interface SpotOrder {
  symbol: string;
  orderId: number;
  clientOrderId: string;
  price: string;
  avgPrice: string;
  origQty: string;
  cumQty: string;
  executedQty: string;
  cumQuote: string;
  status: OrderStatus;
  timeInForce: TimeInForce;
  type: OrderType;
  origType: OrderType;
  side: OrderSide;
  stopPrice: string;
  time?: number;
  updateTime: number;
}

export interface SpotCancelOrderParams {
  symbol: string;
  orderId?: number;
  origClientOrderId?: string;
}

export interface SpotCancelAllParams {
  symbol: string;
  orderIdList?: string;
  origClientOrderIdList?: string;
}

export interface SpotOrderQuery {
  symbol: string;
  orderId?: number;
  origClientOrderId?: string;
}

export interface SpotAllOrdersQuery {
  symbol: string;
  orderId?: number;
  startTime?: number;
  endTime?: number;
  limit?: number;
}

export interface SpotUserTradesQuery {
  symbol?: string;
  orderId?: number;
  startTime?: number;
  endTime?: number;
  fromId?: number;
  limit?: number;
}

export interface SpotUserTrade {
  symbol: string;
  id: number;
  orderId: number;
  side: OrderSide;
  price: string;
  qty: string;
  quoteQty: string;
  commission: string;
  commissionAsset: string;
  time: number;
  counterpartyId: number;
  createUpdateId: number | null;
  maker: boolean;
  buyer: boolean;
}

export interface SpotBalance {
  asset: string;
  free: string;
  locked: string;
}

export interface SpotAccountInfo {
  feeTier: number;
  canTrade: boolean;
  canDeposit: boolean;
  canWithdraw: boolean;
  canBurnAsset: boolean;
  updateTime: number;
  balances: SpotBalance[];
}

export interface SpotTransactionQuery {
  asset?: string;
  type?: string;
  startTime?: number;
  endTime?: number;
  limit?: number;
}

export interface SpotTransactionEntry {
  tranId: number;
  tradeId: number | null;
  asset: string;
  symbol: string;
  balanceDelta: string;
  balanceInfo: string;
  time: number;
  type: string;
}

export enum SpotTransferKind {
  FuturesToSpot = 'FUTURE_SPOT',
  SpotToFutures = 'SPOT_FUTURE',
}

export interface SpotTransferParams {
  asset: string;
  amount: string;
  clientTranId: string;
  kindType: SpotTransferKind;
}

export interface SpotTransferResult {
  tranId: number;
  status: string;
}

// ── Withdraw (EVM-signed, "big op") ───────────────────────────────────────────

export interface WithdrawFeeQuery {
  chainId: string;
  asset: string;
}

export interface WithdrawFee {
  tokenPrice: number;
  gasCost: number;
  gasUsdValue: number;
}

export interface WithdrawParams {
  /** 1 (ETH), 56 (BSC), 42161 (Arbitrum). */
  chainId: string;
  asset: string;
  amount: string;
  fee: string;
  /** Adresse de réception (le compte courant). Défaut : `user` du signer. */
  receiver?: string;
  /** Nom de chaîne destination dans la signature (ex. `BSC`). Défaut dérivé de `chainId`. */
  destinationChain?: string;
}

export interface WithdrawResult {
  withdrawId: string;
  hash: string;
}
