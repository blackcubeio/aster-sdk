# Signing

Aster V3 replaces the V1 `API key + HMAC` model with a **Web3 / agent** model: requests are signed
with an EVM private key over an **EIP-712 typed message**, and carry a microsecond `nonce` for
replay protection.

## The `Message { msg }` envelope (agent signing)

Trading and most `USER_DATA` reads are signed by the **API wallet (agent)** key. The flow:

1. Build the business parameters, then append `nonce` (µs timestamp) and `signer` (agent address).
2. Serialize them as a URL-encoded query string in **insertion order** — this is `msg`.
3. Wrap `msg` in the EIP-712 typed data below and sign it (ECDSA secp256k1).
4. Send the **exact** serialized string on the wire (query or `x-www-form-urlencoded` body) with
   `&signature=0x…` appended, so the server reconstructs an identical `msg`.

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
    "chainId": 1666,                 // mainnet — 714 on testnet
    "verifyingContract": "0x0000000000000000000000000000000000000000"
  },
  "message": { "msg": "<url-encoded query string>" }
}
```

The signature is the 65-byte `r ‖ s ‖ v` hex (v = recovery + 27), exactly as `eth_account` /
`ethers` produce.

### SDK API

```ts
import { buildSignedRequest, signMessage, hashMessage, privateKeyToAddress } from '@blackcube/aster-sdk';

// Used internally by signed endpoints:
const { body, network } = buildSignedRequest({ symbol: 'BTCUSDT', side: 'BUY', /* … */ }, 'trader');
// body === "symbol=BTCUSDT&side=BUY&…&nonce=<µs>&signer=0x…&signature=0x…"
```

- `buildSignedRequest(params, label)` — resolves the signer, appends `nonce`/`signer`, signs, and
  returns the wire-ready form body plus the target network.
- `signMessage(msg, privateKey, chainId)` / `hashMessage(msg, chainId)` — low-level EIP-712 sign /
  digest.
- `privateKeyToAddress(privateKey)` — EVM address (EIP-55 checksummed) from a key.

## Nonce

`nonce` is the current timestamp in **microseconds** (`microsecondNonce()`), strictly increasing,
and must stay within **10 seconds** of server time. Aster keeps the 100 most recent nonces per
user; an already-seen or too-old nonce is rejected. `Noop` reuses a nonce to cancel a queued
order — see roadmap.

## Networks & chain IDs

| Flow | EIP-712 `chainId` mainnet | testnet |
|---|---|---|
| Agent (trading / user_data) | `1666` | `714` |
| Account-management (main wallet) | `56` | `56` |

Agent flows derive the chain ID from the signer's `network` (`AGENT_CHAIN_ID`). Account-management
flows use a fixed `signatureChainId = 56` (`SIGNATURE_CHAIN_ID`), regardless of network.

## ✅ Resolved — account-management signing (`chainId = 56`)

Account-management endpoints (agent approval, sub-accounts, builders, withdraw, asset migration)
are signed by the **main wallet** key (`mainPrivateKey`) and send an extra `signatureChainId`. The
official docs were **internally contradictory** (the "Supported Algorithms" tables stated `56`,
while the inline EIP-712 templates for the same endpoints showed `1666 / 714`).

**Validated empirically against the Aster testnet (2026-06-01)**: an `ApproveAgent` signed in
EIP-712 with `chainId = 56` is **accepted** (`code: 200, msg: "success"`) — no `-1022` "signature
not valid". The whole account-management group shares this signing path (`buildMainTypedRequest`),
so `56` is wired and correct. The signing uses a *dynamic* typed structure (named primary type,
capitalised fields), not the `Message { msg }` envelope. See `tests/chainid-probe.testnet.test.ts`.

## Solana accounts (ed25519)

Aster also supports **native Solana accounts**. The SDK **auto-detects** the key type from
`privateKey`: prefix `0x…` → EVM (secp256k1 / EIP-712) ; otherwise → **Solana** (ed25519 / base58).
No `keyType` field to set.

```ts
const dex = new Aster({ sol: { privateKey: '<base58>', user: '<base58 pubkey>', network: 'mainnet' } });
await dex.account('sol').getBalances();   // signé en ed25519
```

- The Solana account signs the **same querystring** as EVM, but with **ed25519** (signature
  base58) instead of EIP-712 — `signQueryString` branches on the key type. The Solana wallet is its
  own authority (no separate `mainPrivateKey`).
- **No API sub-accounts in Solana.** `getSubAccountList`, `createSubAccount`, `bindSubAccount`,
  `updateSubAccount`, `subAccountTransfer` (and `withdrawSpot`) **throw** for a Solana signer
  (`assertEvmSigner`) — verified non-functional on testnet (they require an EVM agent). Agent/builder
  management for Solana signs ed25519 over the plain querystring.

## Validation status

- ✅ `privateKeyToAddress` is checked against a real key/address vector from the Aster docs
  (`tests/signing.test.ts`).
- ✅ `signMessage` round-trips: the signature recovers to the signer public key.
- ✅ **End-to-end accepted by the live backend**: a real agent-signed `GET /fapi/v3/balance` on
  **mainnet** returns the account balances (`tests/futures-signed.test.ts`) — the `Message{msg}`
  envelope, nonce, and signature are correct.
- ✅ **Solana ed25519** accepted on testnet (a `GET /fapi/v3/balance` signed with the Solana key
  reached business logic — `No agent found`, not a signature error). `solanaAddress` checked against
  the real `SOLANA_PUBLIC_KEY` vector; `signEd25519` round-trips (`tests/solana-signing.test.ts`).
