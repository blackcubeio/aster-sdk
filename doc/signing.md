# Signature

Aster V3 remplace le modèle V1 `clé API + HMAC` par un modèle **Web3 / agent** : les requêtes sont
signées avec une clé privée EVM sur un **message typé EIP-712**, et portent un `nonce` en microsecondes
pour la protection contre le rejeu.

## L'enveloppe `Message { msg }` (signature agent)

Le trading et la plupart des lectures `USER_DATA` sont signés par la clé de l'**API wallet (agent)**.
Le flux :

1. Construire les paramètres métier, puis ajouter `nonce` (timestamp µs) et `signer` (adresse de l'agent).
2. Les sérialiser en query string URL-encodée dans **l'ordre d'insertion** — c'est `msg`.
3. Envelopper `msg` dans la donnée typée EIP-712 ci-dessous et la signer (ECDSA secp256k1).
4. Envoyer **exactement** la chaîne sérialisée sur le fil (query ou corps `x-www-form-urlencoded`) avec
   `&signature=0x…` ajouté, pour que le serveur reconstruise un `msg` identique.

```jsonc
{
  "types": {
    "EIP712Domain": [
      { "name": "name", "type": "string" },
      { "name": "version", "type": "string" },
      { "name": "chainId", "type": "uint256" },
      { "name": "verifyingContract", "type": "address" }
    ],
    "Message": [{ "name": "msg", "type": "string" }]
  },
  "primaryType": "Message",
  "domain": {
    "name": "AsterSignTransaction",
    "version": "1",
    "chainId": 1666,                 // mainnet — 714 sur testnet
    "verifyingContract": "0x0000000000000000000000000000000000000000"
  },
  "message": { "msg": "<query string URL-encodée>" }
}
```

La signature est le hex 65 octets `r ‖ s ‖ v` (v = recovery + 27), exactement comme `eth_account` /
`ethers` les produisent.

### API du SDK

Ces helpers sont **exportés par le package** (valeurs). Ils sont surtout utilisés en interne par les
endpoints signés, mais restent accessibles pour intégrer une signature sur mesure.

```ts
import { buildSignedRequest, signMessage, hashMessage, privateKeyToAddress } from '@blackcube/aster-sdk';

// `buildSignedRequest` reçoit le client interne de la façade ; en usage applicatif courant,
// la signature est faite automatiquement par les méthodes signées (place, withdraw, …).
const address = privateKeyToAddress('0x…'); // adresse EVM (checksum EIP-55) dérivée de la clé
const digest = hashMessage('symbol=BTCUSDT&side=BUY&…', 714); // digest EIP-712 (testnet)
const signature = signMessage('symbol=BTCUSDT&side=BUY&…', '0x…', 714); // r‖s‖v
```

- `buildSignedRequest(client, params, label?)` — résout le signer, ajoute `nonce`/`user`/`signer`, signe,
  et renvoie le corps prêt pour le fil plus le réseau cible (`{ body, network }`).
- `signMessage(msg, privateKey, chainId)` / `hashMessage(msg, chainId)` — signature / digest EIP-712 bas niveau.
- `privateKeyToAddress(privateKey)` — adresse EVM (checksum EIP-55) à partir d'une clé.

## Nonce

`nonce` est le timestamp courant en **microsecondes** (`microsecondNonce()`), strictement croissant,
et doit rester dans les **10 secondes** de l'heure serveur. Aster conserve les 100 nonces les plus
récents par utilisateur ; un nonce déjà vu ou trop ancien est rejeté. `Noop` réutilise un nonce pour
annuler un ordre en file — voir la roadmap.

## Réseaux et chain IDs

| Flux | `chainId` EIP-712 mainnet | testnet |
|---|---|---|
| Agent (trading / user_data) | `1666` | `714` |
| Gestion de compte (wallet principal) | `56` | `56` |

Les flux agent dérivent le chain ID du `network` du signer (`AGENT_CHAIN_ID`). Les flux de gestion de
compte utilisent un `signatureChainId = 56` fixe (`SIGNATURE_CHAIN_ID`), quel que soit le réseau.

## ✅ Résolu — signature de gestion de compte (`chainId = 56`)

Les endpoints de gestion de compte (approbation d'agent, sous-comptes, builders, retrait, migration
d'actifs) sont signés par la clé du **wallet principal** (`mainPrivateKey`) et envoient un
`signatureChainId` supplémentaire. La doc officielle était **contradictoire en interne** (les tableaux
« Supported Algorithms » indiquaient `56`, tandis que les gabarits EIP-712 inline des mêmes endpoints
montraient `1666 / 714`).

**Validé empiriquement contre le testnet Aster (2026-06-01)** : un `ApproveAgent` signé en EIP-712 avec
`chainId = 56` est **accepté** (`code: 200, msg: "success"`) — pas de `-1022` « signature not valid ».
Tout le groupe de gestion de compte partage ce chemin de signature (`buildMainTypedRequest`), donc `56`
est câblé et correct. La signature utilise une structure typée *dynamique* (type primaire nommé, champs
capitalisés), pas l'enveloppe `Message { msg }`. Voir `tests/chainid-probe.testnet.test.ts`.

## Comptes Solana (ed25519)

Aster supporte aussi les **comptes Solana natifs**. Le SDK **auto-détecte** le type de clé depuis
`privateKey` : préfixe `0x…` → EVM (secp256k1 / EIP-712) ; sinon → **Solana** (ed25519 / base58).
Aucun champ `keyType` à renseigner.

```ts
const dex = new Aster({ sol: { privateKey: '<base58>', user: '<base58 pubkey>', network: 'mainnet' } });
await dex.account('sol').getBalances();   // signé en ed25519
```

- Le compte Solana signe la **même query string** que l'EVM, mais en **ed25519** (signature base58)
  au lieu d'EIP-712 — `signQueryString` branche selon le type de clé. Le wallet Solana est sa propre
  autorité (pas de `mainPrivateKey` séparée).
- **Pas de sous-comptes API en Solana.** `getSubAccountList`, `createSubAccount`, `bindSubAccount`,
  `updateSubAccount`, `subAccountTransfer` (et `withdrawSpot`) **lèvent** pour un signer Solana
  (`assertEvmSigner`) — vérifié non fonctionnel sur testnet (ils exigent un agent EVM). La gestion
  agent/builder pour Solana signe en ed25519 sur la query string brute.

## Statut de validation

- ✅ `privateKeyToAddress` est vérifié contre un vecteur clé/adresse réel de la doc Aster
  (`tests/signing.test.ts`).
- ✅ `signMessage` fait l'aller-retour : la signature recouvre la clé publique du signer.
- ✅ **Accepté de bout en bout par le backend live** : un `GET /fapi/v3/balance` signé agent sur
  **mainnet** renvoie les soldes du compte (`tests/futures-signed.test.ts`) — l'enveloppe `Message{msg}`,
  le nonce et la signature sont corrects.
- ✅ **Solana ed25519** accepté sur testnet (un `GET /fapi/v3/balance` signé avec la clé Solana atteint
  la logique métier — `No agent found`, pas une erreur de signature). `solanaAddress` vérifié contre le
  vecteur `SOLANA_PUBLIC_KEY` réel ; `signEd25519` fait l'aller-retour (`tests/solana-signing.test.ts`).
</content>
</invoke>
