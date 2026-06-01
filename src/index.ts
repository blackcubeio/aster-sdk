// ── Surface publique du SDK Aster ─────────────────────────────────────────────
// Point d'entrée unique : la classe `Aster`. Sont aussi exportés comme **valeurs** les
// symboles documentés comme importables (enum `StrategyType` pour `native.perp().placeStrategy`,
// helpers de signature de `doc/signing.md`). Le reste (clients WS bruts, converters, REST) est interne.

/**
 * Façade : `new Aster(signers, { default })` puis les scopes
 * `.perp()` / `.spot()` (marché), `.account()` (compte transverse), `.transfers()` (perp↔spot,
 * master↔sous-compte), `.system()` (connectivité), `.helpers()` (crypto EVM + Solana),
 * `.ws()` / `.wsSpot()` (temps réel) et `.native.<capacité>()` (surplus spécifique Aster).
 */
export { Aster, type AsterDexOptions } from './dex/aster';

/** Enum **valeur** : type de stratégie d'ordre, requis par `dex.native.perp().placeStrategy/editStrategy`. */
export { StrategyType } from './common/futures';

/**
 * Helpers de signature (cf. `doc/signing.md`) exposés comme **valeurs** : construction d'une requête
 * signée agent, signature/hash EIP-712 bas niveau, dérivation d'adresse EVM depuis une clé privée.
 */
export { buildSignedRequest, hashMessage, privateKeyToAddress, signMessage } from './rest/signing';

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
