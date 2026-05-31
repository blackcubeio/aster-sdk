# @blackcube/aster-sdk — Documentation

Le SDK s'utilise via **une seule classe : `Aster`**. La référence complète de la classe
(construction, scopes `perp`/`spot`/`account`/`system`/`helpers`/`ws`, méthodes, exemples REST
et WebSocket) est dans le [README racine](../README.md).

## Sommaire

- [**common.md**](./common.md) — surface **unifiée** (portable), **identique sur les 4 SDK** :
  scopes `perp`/`spot`/`account`/`system`/`helpers`/`ws`, interfaces in/out, méthodes, exemple par méthode.
- [**native.md**](./native.md) — surface **`native` spécifique à Aster** (`agents`, `builders`, `mmp`,
  `modes`, `analytics`, `marketData`, `advancedOrders`, `subAccounts`) : interfaces in/out, méthodes, exemples.
- [README racine](../README.md) — la classe `Aster`, REST vs WebSocket, vue d'ensemble.
- [Signing](./signing.md) — détail des signatures EVM (EIP-712 / secp256k1) et Solana (ed25519),
  modèle de signer, nonce. Bas niveau : ce que la classe fait en interne.

## Principe

- **REST** = requête → réponse : `await dex.perp().getCandles(...)`.
- **WebSocket** = abonnement → flux : `dex.ws().subscribeCandles(..., handler)` ; le handler est
  rappelé à chaque mise à jour ; le `subscribe` renvoie une fonction de désabonnement.

Tous les retours sont au **format unifié** (`Candle`, `Order`, `OrderBook`, `Position`…),
identique entre les SDK Blackcube. Montants/prix = **chaînes décimales**. Les erreurs rejettent
un `AsterApiError` (`status`, `code`, `message`).
