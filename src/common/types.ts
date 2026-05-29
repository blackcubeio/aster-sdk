export type JsonValue = string | number | boolean | null | JsonValue[] | JsonObject;

export interface JsonObject {
  [key: string]: JsonValue;
}

/** Adresse ou clé EVM, préfixée `0x`. */
export type Hex = `0x${string}`;

export type Network = 'mainnet' | 'testnet';

/** Aster expose deux produits sur des hôtes distincts. */
export type Product = 'futures' | 'spot';

/**
 * Identité de signature Aster (EVM). Un signer = un compte principal (`user`) et son
 * API wallet / agent (`privateKey`) qui signe le trading.
 *
 * - `privateKey` : clé de l'API wallet (agent). Signe les actions TRADE / USER_DATA.
 * - `user` : adresse du compte principal (main wallet). Sert aux lectures et identifie
 *   le compte côté backend.
 * - `signer` : adresse de l'API wallet. Dérivée de `privateKey` si omise.
 * - `mainPrivateKey` : clé du main wallet, requise par la gestion de compte
 *   (approveAgent, sous-comptes, withdraw, migrate…) signée par le compte principal.
 */
export interface Signer {
  privateKey: Hex;
  user: Hex;
  signer?: Hex;
  mainPrivateKey?: Hex;
  network: Network;
}

/** Signature ECDSA secp256k1 sérialisée (r ‖ s ‖ v), 65 octets, préfixée `0x`. */
export type Signature = Hex;

export enum OrderSide {
  Buy = 'BUY',
  Sell = 'SELL',
}

export enum PositionSide {
  Both = 'BOTH',
  Long = 'LONG',
  Short = 'SHORT',
}

export enum OrderType {
  Limit = 'LIMIT',
  Market = 'MARKET',
  Stop = 'STOP',
  StopMarket = 'STOP_MARKET',
  TakeProfit = 'TAKE_PROFIT',
  TakeProfitMarket = 'TAKE_PROFIT_MARKET',
  TrailingStopMarket = 'TRAILING_STOP_MARKET',
}

export enum TimeInForce {
  Gtc = 'GTC',
  Ioc = 'IOC',
  Fok = 'FOK',
  Gtx = 'GTX',
  Hidden = 'HIDDEN',
}

export enum WorkingType {
  MarkPrice = 'MARK_PRICE',
  ContractPrice = 'CONTRACT_PRICE',
}

export enum NewOrderRespType {
  Ack = 'ACK',
  Result = 'RESULT',
}

export enum StpMode {
  ExpireTaker = 'EXPIRE_TAKER',
  ExpireMaker = 'EXPIRE_MAKER',
  ExpireBoth = 'EXPIRE_BOTH',
}

export enum OrderStatus {
  New = 'NEW',
  PartiallyFilled = 'PARTIALLY_FILLED',
  Filled = 'FILLED',
  Canceled = 'CANCELED',
  Rejected = 'REJECTED',
  Expired = 'EXPIRED',
}

export enum ContractType {
  Perpetual = 'PERPETUAL',
}

export enum ContractStatus {
  PendingTrading = 'PENDING_TRADING',
  Trading = 'TRADING',
  PreSettle = 'PRE_SETTLE',
  Settling = 'SETTLING',
  Close = 'CLOSE',
}

export enum KlineInterval {
  OneMinute = '1m',
  ThreeMinutes = '3m',
  FiveMinutes = '5m',
  FifteenMinutes = '15m',
  ThirtyMinutes = '30m',
  OneHour = '1h',
  TwoHours = '2h',
  FourHours = '4h',
  SixHours = '6h',
  EightHours = '8h',
  TwelveHours = '12h',
  OneDay = '1d',
  ThreeDays = '3d',
  OneWeek = '1w',
  OneMonth = '1M',
}
