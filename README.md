# @blackcube/aster-sdk

TypeScript SDK pour l'exchange [Aster](https://www.asterdex.com) — DEX perpetuals & spot sur
Aster L1 / BNB Chain. Même surface que `@blackcube/hyperliquid-sdk` et `@blackcube/pacifica-sdk`.

> **V3 uniquement.** Aster V1 (API key + HMAC) n'accepte plus de nouvelles clés depuis le
> 2026-03-25. Ce SDK cible exclusivement le modèle V3 (API wallet / agent).

## Installation

```bash
pnpm add @blackcube/aster-sdk
```

Node.js (≥ 22) et navigateur (crypto via `@noble`).

## Tout passe par la classe `Aster`

Tu n'appelles jamais un endpoint REST ni un client WebSocket directement. Une seule classe
gère la connexion, la signature, le réseau (mainnet/testnet) et la conversion vers les types
unifiés Blackcube.

```ts
import { Aster } from '@blackcube/aster-sdk';

const dex = new Aster(
  { deskA: { privateKey: '0x…', user: '0x…', network: 'testnet' } },
  { default: 'deskA' },
);

// REST : requête → réponse
const candles = await dex.perp().getCandles({ name: 'BTCUSDT', interval: '1m', limit: 100 });
const order = await dex.perp().placeOrder({
  name: 'BTCUSDT', side: 'buy', type: 'limit', size: '0.001', price: '20000',
});

// WebSocket : abonnement → flux
const off = dex.ws().subscribeCandles({ name: 'BTCUSDT', interval: '1m' }, (candle) => {
  console.log(candle.c);
});
off(); // se désabonne (ferme le socket s'il n'y a plus d'abonné)
```

## REST vs WebSocket — la seule distinction à connaître

- **REST** (`perp()`, `spot()`, `account()`, `system()`) : **requête → réponse**. Tu `await`
  un appel, tu reçois une valeur, terminé.
- **WebSocket** (`ws()`, `wsSpot()`) : **abonnement → flux**. Tu passes un *handler* rappelé
  **à chaque** mise à jour, tant que tu n'as pas appelé la fonction de désabonnement renvoyée.
  Pas de `connect()`/`disconnect()` : le socket s'ouvre au premier `subscribe` et se ferme
  seul quand le dernier abonnement est retiré.

Tous les retours (REST comme WS) sont au **format unifié** (`Candle`, `Order`, `OrderBook`,
`Position`, `Trade`, `UserTrade`, `Price`, `Balance`…), identique entre les SDK Blackcube.

## Construction

```ts
new Aster(signers?, options?)
```

- **`signers`** : `Record<label, Signer>`. Un `Signer` = `{ privateKey, user, signer?, network }`.
  Le type de clé est auto-détecté (`0x…` → EVM secp256k1/EIP-712, sinon → Solana ed25519).
  Sans signer, seules les lectures publiques fonctionnent.
- **`options.default`** : label utilisé quand tu n'en précises pas (sinon le premier signer).
- Autres `options` (rarement utiles) : `fetch`, `webSocket`, `restUrls`, `wsUrls`.

Chaque scope accepte un `label` optionnel pour choisir le compte : `dex.perp('deskB')`,
`dex.account('deskB')`… Sans argument → signer par défaut. **Plusieurs instances `Aster`
(comptes/réseaux différents) coexistent** sans interférence — chacune a sa propre config.

## Deux produits, un `kind` porté par le scope

Aster a deux produits (perp `fapi`/`fstream`, spot `sapi`/`sstream`). Le produit est choisi
par le **scope** (`perp()` vs `spot()`), pas par un paramètre `kind`.

### `dex.perp(label?)` / `dex.spot(label?)` — marché + trading + compte du produit

| Catégorie | Méthodes |
|---|---|
| Marché (public) | `getPairs()`, `getCandles(q)`, `getOrderBook(q)`, `getPrices()`, `getFundingHistory(q)`, `getTrades(q)`, `getExchangeInfo()` |
| Compte du produit (signé) | `getPositions(q?)`, `getOpenOrders(q?)`, `getUserTrades(q?)`, `getOrderHistory(q?)`, `getAccountInfo()` |
| Trading (signé) | `placeOrder(i)`, `cancelOrder(i)`, `cancelAllOrders(i)`, `editOrder(i)`, `updateLeverage(i)`, `setMarginMode(i)`, `addIsolatedMargin(i)`, `removeIsolatedMargin(i)` |

> Le spot Aster n'a pas de positions ; `spot().getPositions()` vise le compte perp.

### `dex.account(label?)` — compte transverse (sans produit)

`getBalances()`, `getSubAccounts()`, `withdraw(i)`.

### `dex.system()` — connectivité

`ping()`, `getServerTime()`.

### `dex.helpers()` — crypto (EVM + Solana)

`keyTypeOf(pk)`, `privateKeyToAddress(pk)`, `toChecksumAddress(addr)`, `solanaAddress(pk)`,
`signEd25519(msg, pk)`.

### `dex.ws(label?)` (perp) / `dex.wsSpot(label?)` (spot) — temps réel

Chaque `subscribeX` renvoie une fonction de désabonnement (`Unsubscribe`).

| Catégorie | Méthodes |
|---|---|
| Public | `subscribeCandles(q, cb)`, `subscribeOrderBook(q, cb)`, `subscribeTrades(q, cb)`, `subscribeBbo(q, cb)` (→ `OrderBook` 1 niveau), `subscribePrices(cb)` (→ `Price[]`) |
| Compte (signé) | `subscribeOrders(cb)`, `subscribeUserTrades(cb)`, `subscribePositions(cb)` |

## Exemples

```ts
// Lecture publique sans signer
const pub = new Aster();
const book = await pub.perp().getOrderBook({ name: 'BTCUSDT', limit: 5 });

// Cycle d'ordre (testnet)
const created = await dex.perp().placeOrder({
  name: 'BTCUSDT', side: 'buy', type: 'limit', tif: 'gtc', size: '0.001', price: '20000',
});
await dex.perp().cancelOrder({ name: 'BTCUSDT', id: created.id });

// Spot — mêmes méthodes, retours unifiés (kind: 'spot')
const spotOrders = await dex.spot().getOpenOrders({ name: 'ASTERUSDT' });

// Compte transverse
const balances = await dex.account().getBalances();

// Temps réel : suivre ses propres fills
const off = dex.ws().subscribeUserTrades((fill) => console.log(fill.price, fill.size));
```

## Erreurs

Les appels rejettent un `AsterApiError` (`status`, `code`, `message`) — `code`/`msg` viennent
de l'enveloppe `{ "code": -1121, "msg": "…" }` d'Aster.

## Documentation

Détail des signatures (EVM EIP-712 / Solana ed25519) : [`doc/signing.md`](doc/signing.md).

## License

BSD-3-Clause © Blackcube
