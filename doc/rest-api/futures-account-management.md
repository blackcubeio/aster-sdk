# Futures — Account management (main-wallet signed)

These endpoints are signed by the **master account** (`mainPrivateKey`), not the agent — except
`getSubAccountList`, which is agent-signed. The signer must therefore carry a `mainPrivateKey`:

```ts
init({ signers: { trader: { privateKey: agentKey, user, signer, mainPrivateKey, network: 'mainnet' } } });
```

All signatures use the same EIP-712 `Message{msg}` envelope, **chainId 1666 (mainnet) / 714
(testnet)** — empirically confirmed against the live API.

🔑 = agent-signed · 👤 = master-account-signed · ✍️ = dual signature (sub + master).

| Function | Endpoint | Auth | Returns |
|---|---|---|---|
| 🔑 `getSubAccountList(label)` | `GET /fapi/v3/getSubAccountList` | agent | `SubAccount[]` |
| 👤 `registerAndApproveAgent(params, label)` | `POST /fapi/v3/registerAndApproveAgent` | master | `CodeMsg` |
| 👤 `updateSubAccount(params, label)` | `POST /fapi/v3/updateSubAccount` | master | `CodeMsg` |
| ✍️ `createSubAccount(params, label)` | `POST /fapi/v3/createSubAccount` | sub + master | `CodeMsg` |
| ✍️ `bindSubAccount(params, label)` | `POST /fapi/v3/sub-accounts/bind` | sub + master | `CodeMsg` |
| 👤 `subAccountTransfer(params, label)` | `POST /fapi/v3/subAccountTransfer` | master | `CodeMsg` |
| 👤 `migrateUser(label)` | `POST /fapi/v3/asset/migrateUser` | master | `MigrateUserResult` |
| 🔑 `getMigrateHistory(batchId, label)` | `GET /fapi/v3/asset/migrateUser/history` | agent | `MigrateHistory` |

## Signing notes

- The signed `msg` field order is **endpoint-specific** (the SDK builds it in the documented
  order) and always includes `user` (and usually `signer`).
- **Dual signature** (`createSubAccount`, `bindSubAccount`): the sub-account first signs the base
  message with its own key (`childPrivateKey`), then the master signs the same message **plus
  `childSignature`**. Sub-account creation requires whitelisted addresses (contact Aster).
- `registerAndApproveAgent` carries a `signatureChainId` **field** (56 = EVM, 101 = Solana) inside
  the message — this is the address-type marker, distinct from the EIP-712 domain `chainId` (1666).
- `migrateUser` moves **all** positive balances to the authenticated account; the source must have
  no open positions or orders.

> Validated non-destructively: a main-signed `updateSubAccount` on a bogus sub-account returns a
> business error (`subaccount relation error`), not `-1022` — proving the signature is accepted.
> The state-changing endpoints here are **not** run in the test suite (real funds / whitelisting).
