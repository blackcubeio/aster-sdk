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

/** Réponse générique `{ code, msg }` des actions de configuration. */
export interface CodeMsg {
  code: number;
  msg: string;
}

export enum MarginType {
  Isolated = 'ISOLATED',
  Crossed = 'CROSSED',
}

export enum TransferKind {
  FuturesToSpot = 'FUTURE_SPOT',
  SpotToFutures = 'SPOT_FUTURE',
}

export enum QuantityUnit {
  Base = 'BASE',
  Quote = 'QUOTE',
}

export enum ChaseOffsetType {
  Absolute = 'ABSOLUTE',
  Percentage = 'PERCENTAGE',
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

/** Un ordre dans un batch peut renvoyer un succès (`Order`) ou une erreur par item. */
export type BatchOrderResult = Order | CodeMsg;

/** Ordre renvoyé par les lectures (queryOrder/openOrders/allOrders) : `Order` + `time`. */
export interface OrderDetail extends Order {
  time: number;
}

// ── USER_DATA reads ───────────────────────────────────────────────────────────

export interface OrderQuery {
  symbol: string;
  orderId?: number;
  origClientOrderId?: string;
}

export interface AllOrdersQuery {
  symbol: string;
  orderId?: number;
  startTime?: number;
  endTime?: number;
  limit?: number;
}

export interface UserTradesQuery {
  symbol: string;
  startTime?: number;
  endTime?: number;
  fromId?: number;
  limit?: number;
}

export interface IncomeQuery {
  symbol?: string;
  incomeType?: string;
  startTime?: number;
  endTime?: number;
  limit?: number;
}

export interface ForceOrdersQuery {
  symbol?: string;
  autoCloseType?: 'LIQUIDATION' | 'ADL';
  startTime?: number;
  endTime?: number;
  limit?: number;
}

export interface PositionMarginHistoryQuery {
  symbol: string;
  type?: 1 | 2;
  startTime?: number;
  endTime?: number;
  limit?: number;
}

export interface PositionRisk {
  symbol: string;
  positionSide: PositionSide;
  positionAmt: string;
  entryPrice: string;
  markPrice: string;
  unRealizedProfit: string;
  liquidationPrice: string;
  leverage: string;
  maxNotionalValue: string;
  marginType: string;
  isolatedMargin: string;
  isAutoAddMargin: string;
  updateTime: number;
}

export interface UserTrade {
  id: number;
  orderId: number;
  symbol: string;
  side: OrderSide;
  positionSide: PositionSide;
  price: string;
  qty: string;
  quoteQty: string;
  realizedPnl: string;
  commission: string;
  commissionAsset: string;
  buyer: boolean;
  maker: boolean;
  time: number;
}

export interface IncomeEntry {
  symbol: string;
  incomeType: string;
  income: string;
  asset: string;
  info: string;
  time: number;
  tranId: string;
  tradeId: string;
}

export interface LeverageBracketLevel {
  bracket: number;
  initialLeverage: number;
  notionalCap: number;
  notionalFloor: number;
  maintMarginRatio: number;
  cum: number;
}

export interface LeverageBracket {
  symbol: string;
  brackets: LeverageBracketLevel[];
}

export interface AdlQuantile {
  symbol: string;
  adlQuantile: Record<string, number>;
}

export interface CommissionRate {
  symbol: string;
  makerCommissionRate: string;
  takerCommissionRate: string;
}

export interface PositionMarginHistoryEntry {
  symbol: string;
  asset: string;
  amount: string;
  type: number;
  positionSide: PositionSide;
  time: number;
}

export interface AccountAsset {
  asset: string;
  walletBalance: string;
  unrealizedProfit: string;
  marginBalance: string;
  maintMargin: string;
  initialMargin: string;
  positionInitialMargin: string;
  openOrderInitialMargin: string;
  crossWalletBalance: string;
  crossUnPnl: string;
  availableBalance: string;
  maxWithdrawAmount: string;
  marginAvailable: boolean;
  updateTime: number;
}

export interface AccountPosition {
  symbol: string;
  positionSide: PositionSide;
  positionAmt: string;
  initialMargin: string;
  maintMargin: string;
  unrealizedProfit: string;
  positionInitialMargin: string;
  openOrderInitialMargin: string;
  leverage: string;
  isolated: boolean;
  entryPrice: string;
  maxNotional: string;
  updateTime: number;
}

export interface AccountInfo {
  feeTier: number;
  canTrade: boolean;
  canDeposit: boolean;
  canWithdraw: boolean;
  updateTime: number;
  totalInitialMargin: string;
  totalMaintMargin: string;
  totalWalletBalance: string;
  totalUnrealizedProfit: string;
  totalMarginBalance: string;
  totalPositionInitialMargin: string;
  totalOpenOrderInitialMargin: string;
  totalCrossWalletBalance: string;
  totalCrossUnPnl: string;
  availableBalance: string;
  maxWithdrawAmount: string;
  assets: AccountAsset[];
  positions: AccountPosition[];
}

export interface ModifyOrderParams {
  symbol: string;
  quantity: string;
  price: string;
  orderId?: number;
  origClientOrderId?: string;
}

export interface CancelOrderParams {
  symbol: string;
  orderId?: number;
  origClientOrderId?: string;
}

export interface CancelMultipleOrdersParams {
  symbol: string;
  orderIdList?: number[];
  origClientOrderIdList?: string[];
}

export interface CountdownCancelAllParams {
  symbol: string;
  /** 1000 = 1 s ; 0 annule le minuteur. */
  countdownTime: number;
}

export interface CountdownCancelAllResult {
  symbol: string;
  countdownTime: string;
}

export interface SetLeverageParams {
  symbol: string;
  leverage: number;
}

export interface LeverageResult {
  symbol: string;
  leverage: number;
  maxNotionalValue: string;
}

export interface SetMarginTypeParams {
  symbol: string;
  marginType: MarginType;
}

export interface ModifyIsolatedMarginParams {
  symbol: string;
  amount: string;
  /** 1 : ajouter de la marge ; 2 : retirer de la marge. */
  type: 1 | 2;
  positionSide?: PositionSide;
}

export interface ModifyIsolatedMarginResult {
  amount: number;
  type: number;
  code: number;
  msg: string;
}

export interface TransferParams {
  asset: string;
  amount: string;
  clientTranId: string;
  kindType: TransferKind;
}

export interface TransferResult {
  tranId: number;
  status: string;
}

export interface PositionModeResult {
  dualSidePosition: boolean;
}

export interface StpModeResult {
  stpMode: StpMode;
}

export interface MultiAssetsModeResult {
  multiAssetsMargin: boolean;
}

export interface ChaseOrderParams {
  symbol: string;
  side: OrderSide;
  quantityUnit: QuantityUnit;
  quantity: string;
  positionSide?: PositionSide;
  reduceOnly?: boolean;
  chaseOffset?: string;
  chaseOffsetType?: ChaseOffsetType;
  maxChaseOffset?: string;
  maxChaseOffsetType?: ChaseOffsetType;
  priceLimit?: string;
  timeInForce?: TimeInForce;
  clientStrategyId?: string;
}

export interface ChaseOrder {
  strategyId: number;
  clientStrategyId: string;
  symbol: string;
  side: OrderSide;
  positionSide: PositionSide;
  quantity: string;
  quantityUnit: QuantityUnit;
  reduceOnly: boolean;
  chaseOffset: string;
  chaseOffsetType: ChaseOffsetType;
  maxChaseOffset: string;
  maxChaseOffsetType: ChaseOffsetType;
  priceLimit: string;
  timeInForce: TimeInForce;
  strategyStatus: string;
  bookTime: number;
  updateTime: number;
}
