import type {
  ContractStatus,
  ContractType,
  KlineInterval,
  NewOrderRespType,
  OrderSide,
  OrderStatus,
  OrderType,
  PositionSide,
  StpMode,
  TimeInForce,
  WorkingType,
} from '../../common/types';

// ── Exchange information ──────────────────────────────────────────────────────

export interface RateLimit {
  rateLimitType: string;
  interval: string;
  intervalNum: number;
  limit: number;
}

export interface ExchangeAsset {
  asset: string;
  marginAvailable: boolean;
  autoAssetExchange: number | null;
}

export interface PriceFilter {
  filterType: 'PRICE_FILTER';
  minPrice: string;
  maxPrice: string;
  tickSize: string;
}
export interface LotSizeFilter {
  filterType: 'LOT_SIZE' | 'MARKET_LOT_SIZE';
  minQty: string;
  maxQty: string;
  stepSize: string;
}
export interface MaxNumOrdersFilter {
  filterType: 'MAX_NUM_ORDERS' | 'MAX_NUM_ALGO_ORDERS';
  limit: number;
}
export interface MinNotionalFilter {
  filterType: 'MIN_NOTIONAL';
  notional: string;
}
export interface PercentPriceFilter {
  filterType: 'PERCENT_PRICE';
  multiplierUp: string;
  multiplierDown: string;
  multiplierDecimal: number;
}
export type SymbolFilter =
  | PriceFilter
  | LotSizeFilter
  | MaxNumOrdersFilter
  | MinNotionalFilter
  | PercentPriceFilter;

export interface FuturesSymbol {
  symbol: string;
  pair: string;
  contractType: ContractType | '';
  deliveryDate: number;
  onboardDate: number;
  status: ContractStatus;
  baseAsset: string;
  quoteAsset: string;
  marginAsset: string;
  pricePrecision: number;
  quantityPrecision: number;
  baseAssetPrecision: number;
  quotePrecision: number;
  underlyingType: string;
  underlyingSubType: string[];
  triggerProtect: string;
  liquidationFee: string;
  marketTakeBound: string;
  filters: SymbolFilter[];
  OrderType: string[];
  timeInForce: string[];
}

export interface ExchangeInfo {
  timezone: string;
  serverTime: number;
  rateLimits: RateLimit[];
  exchangeFilters: unknown[];
  assets: ExchangeAsset[];
  symbols: FuturesSymbol[];
}

// ── Market data ───────────────────────────────────────────────────────────────

export interface ServerTime {
  serverTime: number;
}

export interface PriceLevel {
  price: string;
  qty: string;
}

export interface OrderBook {
  lastUpdateId: number;
  /** Message output time (`E`). */
  eventTime: number;
  /** Transaction time (`T`). */
  transactionTime: number;
  bids: PriceLevel[];
  asks: PriceLevel[];
}

export interface Trade {
  id: number;
  price: string;
  qty: string;
  quoteQty: string;
  time: number;
  isBuyerMaker: boolean;
}

export interface AggTrade {
  aggTradeId: number;
  price: string;
  quantity: string;
  firstTradeId: number;
  lastTradeId: number;
  timestamp: number;
  isBuyerMaker: boolean;
}

export interface Kline {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteVolume: string;
  tradeCount: number;
  takerBuyBaseVolume: string;
  takerBuyQuoteVolume: string;
}

export interface MarkPrice {
  symbol: string;
  markPrice: string;
  indexPrice: string;
  estimatedSettlePrice: string;
  lastFundingRate: string;
  nextFundingTime: number;
  interestRate: string;
  time: number;
}

export interface FundingRateEntry {
  symbol: string;
  fundingRate: string;
  fundingTime: number;
}

export interface FundingInfo {
  symbol: string;
  interestRate: string;
  time: number;
  fundingIntervalHours: number;
  fundingFeeCap: number;
  fundingFeeFloor: number;
}

export interface Ticker24hr {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  lastQty: string;
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
}

export interface PriceTicker {
  symbol: string;
  price: string;
  time: number;
}

export interface BookTicker {
  symbol: string;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
  time: number;
}

export interface IndexPriceReference {
  exchange: string;
  symbol: string;
  weight: string;
}

export interface IndexPriceReferences {
  symbol: string;
  time: number;
  references: IndexPriceReference[];
}

// ── Query parameters ────────────────────────────────────────────────────────

export interface DepthQuery {
  symbol: string;
  limit?: number;
}

export interface TradesQuery {
  symbol: string;
  limit?: number;
}

export interface HistoricalTradesQuery {
  symbol: string;
  limit?: number;
  fromId?: number;
}

export interface AggTradesQuery {
  symbol: string;
  fromId?: number;
  startTime?: number;
  endTime?: number;
  limit?: number;
}

export interface KlinesQuery {
  symbol: string;
  interval: KlineInterval;
  startTime?: number;
  endTime?: number;
  limit?: number;
}

export interface IndexPriceKlinesQuery {
  pair: string;
  interval: KlineInterval;
  startTime?: number;
  endTime?: number;
  limit?: number;
}

export interface FundingRateQuery {
  symbol?: string;
  startTime?: number;
  endTime?: number;
  limit?: number;
}

// ── Trading (signed) ──────────────────────────────────────────────────────────

/** Mode de peg BBO d'un ordre `LIMIT`. */
export enum PegPriceType {
  Counterparty1 = 'COUNTERPARTY_1',
  Queue1 = 'QUEUE_1',
}

export interface NewOrderParams {
  symbol: string;
  side: OrderSide;
  type: OrderType;
  positionSide?: PositionSide;
  timeInForce?: TimeInForce;
  quantity?: string;
  reduceOnly?: boolean;
  price?: string;
  newClientOrderId?: string;
  stopPrice?: string;
  closePosition?: boolean;
  activationPrice?: string;
  callbackRate?: string;
  workingType?: WorkingType;
  priceProtect?: boolean;
  newOrderRespType?: NewOrderRespType;
  pegPriceType?: PegPriceType;
  pegOffset?: string;
  priceLimit?: string;
  stpMode?: StpMode;
}

export interface FuturesBalance {
  accountAlias: string;
  asset: string;
  balance: string;
  crossWalletBalance: string;
  crossUnPnl: string;
  availableBalance: string;
  maxWithdrawAmount: string;
  marginAvailable: boolean;
  updateTime: number;
}

export interface Order {
  orderId: number;
  clientOrderId: string;
  symbol: string;
  status: OrderStatus;
  side: OrderSide;
  positionSide: PositionSide;
  type: OrderType;
  origType: OrderType;
  timeInForce: TimeInForce;
  price: string;
  avgPrice: string;
  origQty: string;
  executedQty: string;
  cumQty: string;
  cumQuote: string;
  reduceOnly: boolean;
  closePosition: boolean;
  stopPrice: string;
  workingType: WorkingType;
  priceProtect: boolean;
  activatePrice?: string;
  priceRate?: string;
  updateTime: number;
}
