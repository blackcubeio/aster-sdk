export type JsonValue = string | number | boolean | null | JsonValue[] | JsonObject;

export interface JsonObject {
  [key: string]: JsonValue;
}

/** Adresse ou clé EVM, préfixée `0x`. */
export type Hex = `0x${string}`;

export type Network = 'mainnet' | 'testnet';

/** Aster expose deux produits sur des hôtes distincts. */
export type Product = 'futures' | 'spot';

/** Type de marché d'une paire : perpetual (futures) ou spot. */
export type MarketKind = 'perp' | 'spot';

/**
 * Paire/marché au **format unifié Blackcube** (mêmes champs entre les SDK
 * hyperliquid/pacifica/aster, calqués sur HL). Prix/quantités = **chaînes décimales**.
 * `raw` conserve l'objet d'origine **complet** de l'exchange : rien n'est jeté.
 */
export interface Pair {
  /** Nom/identifiant de la paire (HL: `name`, ex. `BTC`, `BTCUSDT`, `@1`). */
  name: string;
  /** Actif de base. */
  base: string;
  /** Actif de cotation. */
  quote: string;
  /** Type de marché (`perp`/`spot`). */
  kind: MarketKind;
  /** Décimales de taille (HL: `szDecimals`) → pas de quantité = `10^-szDecimals`. */
  szDecimals: number;
  /** Levier max (perp uniquement), si fourni. */
  maxLeverage?: number;
  /** Pas de prix, si fourni (Aster/Pacifica ; HL : dérivé, absent). */
  tickSize?: string;
  /** Pas de quantité, si fourni. */
  stepSize?: string;
  /** Notionnel minimum d'un ordre, si fourni. */
  minNotional?: string;
  /** État du marché (ex. `TRADING`), si fourni. */
  status?: string;
  /**
   * Champs natifs **hors cœur unifié** (rien n'est jeté). **Optionnel** : omis si tout le natif
   * mappe le cœur. Aster : `filters`, `pricePrecision`, `orderTypes`, `timeInForce`…
   */
  xtras?: Record<string, unknown>;
}

/**
 * Bougie OHLCV au **format unifié Blackcube** (clés courtes, cœur identique entre les SDK
 * hyperliquid/pacifica/aster). Prix et volumes sont des **chaînes décimales**.
 *
 * Le **cœur** (`t…kind`) regroupe les champs vraiment communs aux 3 exchanges.
 * **Tout le reste** (champs non standard, propres à l'exchange) va dans `xtras` :
 * **rien n'est jeté**, et `toNative(toCommon(x)) ≡ x` (bijection totale).
 */
export interface Candle {
  /** Open time — début de la bougie (timestamp ms). */
  t: number;
  /** Close time — fin de la bougie (timestamp ms). */
  T: number;
  /** Symbol — symbole/paire (ex. `BTCUSDT`). */
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
  /** Type de marché (`perp`/`spot`). */
  kind: MarketKind;
  /** Quote volume — volume en cotation. `null` si l'exchange ne le fournit pas (HL/Pacifica). */
  qv: string | null;
  /** Taker buy base volume — volume acheteur taker en base. `null` si non fourni. */
  tbbv: string | null;
  /** Taker buy quote volume — volume acheteur taker en cotation. `null` si non fourni. */
  tbqv: string | null;
  /**
   * Reste des champs **non standard / non modélisés**, propres à l'exchange (rien n'est jeté).
   * **Optionnel** : omis quand il n'y a rien à y mettre. Aster : `{ ignore }` (12ᵉ colonne wire).
   */
  xtras?: Record<string, unknown>;
}

/** Niveau de carnet au **format unifié** (prix + taille ; `n` = nb d'ordres, `null` si non fourni). */
export interface OrderBookLevel {
  /** Prix du niveau (chaîne décimale). */
  price: string;
  /** Taille cumulée au niveau (chaîne décimale). */
  size: string;
  /** Nombre d'ordres au niveau ; `null` si l'exchange ne le fournit pas (Aster). */
  n: number | null;
}

/**
 * Carnet d'ordres au **format unifié Blackcube** (cœur identique entre les SDK).
 * `bids` décroissants, `asks` croissants. `time` = timestamp ms (`null` si non fourni).
 * `xtras` porte le natif hors cœur (rien jeté), omis si vide.
 */
export interface OrderBook {
  /** Paire/symbole (= `Pair.name`). */
  name: string;
  /** Type de marché (`perp`/`spot`). */
  kind: MarketKind;
  /** Niveaux acheteurs (prix décroissant). */
  bids: OrderBookLevel[];
  /** Niveaux vendeurs (prix croissant). */
  asks: OrderBookLevel[];
  /** Timestamp du carnet (ms) ; `null` si non fourni. */
  time: number | null;
  /** Champs natifs hors cœur (rien jeté), omis si vide. Aster : `lastUpdateId`, `eventTime`. */
  xtras?: Record<string, unknown>;
}

/**
 * Snapshot de prix d'un marché au **format unifié Blackcube** (cœur identique entre les SDK).
 * Chaque exchange remplit ce qu'il fournit ; le reste est `null`. `xtras` porte le hors-cœur.
 */
export interface Price {
  /** Paire/symbole (= `Pair.name`). */
  name: string;
  /** Type de marché (`perp`/`spot`). */
  kind: MarketKind;
  /** Mark price ; `null` si non fourni. */
  mark: string | null;
  /** Oracle/index price ; `null` si non fourni. */
  oracle: string | null;
  /** Mid price ; `null` si non fourni. */
  mid: string | null;
  /** Funding rate courant ; `null` si non fourni. */
  funding: string | null;
  /** Open interest ; `null` si non fourni. */
  openInterest: string | null;
  /** Volume 24h (notionnel) ; `null` si non fourni. */
  volume24h: string | null;
  /** Prix de clôture de la veille ; `null` si non fourni. */
  prevDayPrice: string | null;
  /** Timestamp (ms) ; `null` si non fourni. */
  time: number | null;
  /** Champs natifs hors cœur (rien jeté), omis si vide. */
  xtras?: Record<string, unknown>;
}

/** Côté d'un ordre/trade : achat ou vente. */
export type Side = 'buy' | 'sell';

/**
 * Trade public au **format unifié Blackcube** (cœur identique entre les SDK).
 * `side` = direction du **taker** (agresseur). `maker` = ce record est-il le maker
 * (`null` si modèle par-trade, ex. Aster). `xtras` porte le natif hors cœur.
 */
export interface Trade {
  /** Prix d'exécution (chaîne décimale). */
  price: string;
  /** Taille exécutée (chaîne décimale). */
  size: string;
  /** Direction du taker/agresseur ; `null` si indéterminé. */
  side: Side | null;
  /** Ce record est-il le maker ; `null` si non applicable (modèle par-trade). */
  maker: boolean | null;
  /** Timestamp (ms). */
  time: number;
  /** ID du trade ; `null` si non fourni. */
  id: number | null;
  /** Champs natifs hors cœur (rien jeté), omis si vide. */
  xtras?: Record<string, unknown>;
}

/**
 * Identité de signature Aster. Le **type est auto-détecté** depuis `privateKey` :
 * préfixe `0x…` → **EVM** (secp256k1 / EIP-712), sinon → **Solana** (ed25519 / base58).
 *
 * - `privateKey` : clé qui signe les actions TRADE / USER_DATA (API wallet EVM, ou wallet
 *   Solana). Hex `0x…` pour EVM, base58 pour Solana.
 * - `user` : adresse du compte principal (Hex EVM ou base58 Solana). Sert aux lectures et
 *   identifie le compte côté backend.
 * - `signer` : adresse de l'API wallet / du wallet signataire. Dérivée de `privateKey` si omise.
 * - `mainPrivateKey` : clé du main wallet pour la gestion de compte EVM (approveAgent,
 *   migrate…). En Solana, la même clé fait tout (pas de sous-comptes — voir doc).
 */
export interface Signer {
  privateKey: string;
  user: string;
  signer?: string;
  mainPrivateKey?: string;
  network: Network;
}

/** Type de clé d'un signer, déduit du format de `privateKey`. */
export type KeyType = 'evm' | 'solana';

/** Signature sérialisée : `0x…` (ECDSA secp256k1, EVM) ou base58 (ed25519, Solana). */
export type Signature = string;

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
