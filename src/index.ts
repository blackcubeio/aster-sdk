// ── Surface publique du SDK Aster ─────────────────────────────────────────────
// Point d'entrée unique : la classe `Aster`. Tout le reste (fonctions REST, clients WS
// bruts, signing, types natifs) est interne et n'est pas exporté.

/** Façade : `new Aster(signers, { default })` puis `.perp()/.spot()/.account()/.system()/.helpers()/.ws()`. */
export { Aster, type AsterDexOptions } from './dex/aster';

/** Contrat : interfaces de capacités + types d'entrée (Input) des méthodes. */
export type * from './dex/contract';

/** Interfaces **complémentaires** Aster (surplus exposé via `dex.native.<capacité>()`). */
export type * from './dex/native-contract';

/** Configuration d'un signer (passé au constructeur) et réseau. */
export type { Signer, Network } from './common/types';

/** Types **de sortie** unifiés renvoyés par les méthodes de la façade. */
export type {
  Balance,
  Candle,
  FundingRate,
  MarketKind,
  Order,
  OrderBook,
  OrderBookLevel,
  Pair,
  Position,
  Price,
  Side,
  SubAccount,
  Trade,
  UserTrade,
} from './common/types';

/** Unsubscribe : valeur de retour des souscriptions WS. */
export type { Unsubscribe } from './common/ws';
