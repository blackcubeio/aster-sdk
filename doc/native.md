# Surface `native` — spécifique à `@blackcube/aster-sdk`

Capacités **propres à Aster**, hors contrat unifié (voir [`common.md`](common.md) pour le portable).
Accès **`dex.native.<capacité>(label?)`**. Le namespace `native` **miroite** le commun :

| commun (portable) | natif (spécifique) |
|---|---|
| `dex.perp()` | `dex.native.perp()` — reads marché + ordres avancés |
| `dex.account()` | `dex.native.account()` — lectures de compte étendues (ex-`analytics`) |
| `dex.transfers()` | — |

Capacités **sans équivalent commun** : `native.agents()`, `native.builders()`, `native.mmp()`,
`native.modes()`, `native.subAccounts()`, `native.prediction()`.

```ts
const dex = new Aster({ desk: signer }, { default: 'desk' });
dex.native.agents().getAgents();
```

`label?` choisit le signer (défaut : signer par défaut). Lectures signées comprises (compte privé).

---

## `native.agents()` — `IAgents` (API wallets / agents)
| Méthode | Entrée | Sortie |
|---|---|---|
| `getAgents()` | — | `Promise<Agent[]>` |
| `approve(p)` | `ApproveAgentParams` | `Promise<CodeMsg>` |
| `register(p)` | `RegisterAgentParams` | `Promise<CodeMsg>` |
| `update(p)` | `UpdateAgentParams` | `Promise<CodeMsg>` |
| `revoke(agentAddress)` | `string` | `Promise<CodeMsg>` |

```ts
await dex.native.agents().getAgents();
await dex.native.agents().approve({ agentAddress: '0x…', agentName: 'bot' });
await dex.native.agents().register({ agentAddress: '0x…' });
await dex.native.agents().update({ agentAddress: '0x…', agentName: 'bot2' });
await dex.native.agents().revoke('0x…');
```

## `native.builders()` — `IBuilders` (fee builders)
| `getBuilders()` | — | `Promise<Builder[]>` |
| `approve(p)` | `ApproveBuilderParams` | `Promise<CodeMsg>` |
| `update(p)` | `UpdateBuilderParams` | `Promise<CodeMsg>` |
| `revoke(builder)` | `string` | `Promise<CodeMsg>` |

```ts
await dex.native.builders().getBuilders();
await dex.native.builders().approve({ builder: '0x…', maxFeeRate: '0.001' });
await dex.native.builders().revoke('0x…');
```

## `native.mmp()` — `IMmp` (market-maker protection)
| `getConfig(symbol?)` | `string?` | `Promise<MmpConfig[]>` |
| `set(p)` | `UpdateMmpParams` | `Promise<boolean>` |
| `reset(symbol)` | `string` | `Promise<boolean>` |
| `remove(symbol)` | `string` | `Promise<boolean>` |

```ts
await dex.native.mmp().getConfig('BTCUSDT');
await dex.native.mmp().set({ symbol: 'BTCUSDT', windowMs: 5000, frozenMs: 10000, qtyLimit: '100' });
await dex.native.mmp().reset('BTCUSDT');
await dex.native.mmp().remove('BTCUSDT');
```

## `native.modes()` — `IModes` (multi-assets / position / STP)
| `getMultiAssets()` | — | `Promise<MultiAssetsModeResult>` |
| `setMultiAssets(enabled)` | `boolean` | `Promise<CodeMsg>` |
| `getPosition()` | — | `Promise<PositionModeResult>` |
| `setPosition(dualSide)` | `boolean` | `Promise<CodeMsg>` |
| `getStp()` | — | `Promise<StpModeResult>` |
| `setStp(mode)` | `SetStpModeParams` | `Promise<CodeMsg>` |

```ts
await dex.native.modes().getMultiAssets();           // { multiAssetsMargin: true }
await dex.native.modes().setMultiAssets(false);
await dex.native.modes().getPosition();              // { dualSidePosition: false }
await dex.native.modes().setPosition(true);          // hedge mode
await dex.native.modes().getStp();                   // { stpMode: 'EXPIRE_MAKER' }
await dex.native.modes().setStp('EXPIRE_TAKER');
```

## `native.account()` — `INativeAccount` (lectures de compte, ex-`analytics`)
**I/O normalisés** : entrées en vocabulaire commun (`name`, dates `YYYY-MM-DD HH:MM:SS` UTC),
sorties typées (`Order[]` pour les ordres de liquidation ; interfaces nommées sinon — jamais `unknown`).

| Méthode | Entrée | Sortie |
|---|---|---|
| `getForceOrders(query?)` | `ForceOrdersParams?` (`{ name?, autoCloseType?, startTime?, endTime?, limit? }`) | `Promise<Order[]>` |
| `getAdlQuantile(name?)` | `string?` | `Promise<AdlQuantile[]>` |
| `getCommissionRate(name)` | `string` | `Promise<CommissionRate>` |
| `getIncome(query?)` | `IncomeParams?` (`{ name?, incomeType?, startTime?, endTime?, limit? }`) | `Promise<IncomeEntry[]>` |
| `getLeverageBracket(name?)` | `string?` | `Promise<LeverageBracket \| LeverageBracket[]>` |
| `getMarginHistory(query)` | `MarginHistoryParams` (`{ name, type?, startTime?, endTime?, limit? }`) | `Promise<PositionMarginHistoryEntry[]>` |

```ts
await dex.native.account().getCommissionRate('BTCUSDT'); // { makerCommissionRate, takerCommissionRate }
await dex.native.account().getIncome({ incomeType: 'FUNDING_FEE', limit: 100 });
await dex.native.account().getLeverageBracket('BTCUSDT');
await dex.native.account().getAdlQuantile();
await dex.native.account().getForceOrders();                       // Order[] (type commun)
await dex.native.account().getMarginHistory({ name: 'BTCUSDT', startTime: '2026-01-01 00:00:00' });
```

## `native.perp()` — `INativePerp` (miroir natif de `perp()`)
Surplus **perp** : lectures marché supplémentaires (publiques) **+** ordres avancés (signés).
**Même discipline d'I/O que le commun** : entrées en vocabulaire commun (`name`, `side:'buy'|'sell'`,
`size`, dates `YYYY-MM-DD HH:MM:SS` UTC), sorties via convertisseurs réutilisant les types communs
(`Trade`/`Price`/`Order`) quand le concept existe, sinon interface dédiée nommée (`FundingConfig`,
`IndexComposition`, `ChaseResult`, `StrategyInfo`).

| Méthode | Entrée | Sortie |
|---|---|---|
| `getAggregateTrades(query)` | `AggregateTradesParams` (`{ name, fromId?, startTime?, endTime?, limit? }`) | `Promise<Trade[]>` |
| `getHistoricalTrades(query)` | `HistoricalTradesParams` (`{ name, limit?, fromId? }`) | `Promise<Trade[]>` |
| `getFundingInfo(name?)` | `string?` | `Promise<FundingConfig[]>` |
| `getIndexPriceReferences(name)` | `string` | `Promise<IndexComposition>` |
| `getTicker24hr(name?)` | `string?` | `Promise<Price[]>` |
| `placeBatch(orders)` | `PlaceOrderParams[]` (vocab commun) | `Promise<Order[]>` (1 par leg) |
| `cancelMany(p)` | `CancelManyParams` (`{ name, ids?, clientIds? }`) | `Promise<Order[]>` (1 par ordre visé) |
| `chase(p)` | `ChaseParams` (`{ name, side, size, … }`) | `Promise<ChaseResult>` |
| `placeStrategy(p)` | `PlaceStrategyParams` (`{ strategyType, legs, clientId? }`) | `Promise<PlaceStrategyOrderResult>` |
| `editStrategy(p)` | `EditStrategyParams` (`{ id, strategyType, legs }`) | `Promise<UpdateStrategyOrderResult[]>` |
| `getStrategies(query)` | `StrategyQueryParams` (`{ strategyType, id?, clientId? }`) | `Promise<StrategyInfo>` |
| `getStrategyHistory(query)` | `StrategyQueryParams` (+ `startTime?/endTime?/limit?`) | `Promise<StrategyInfo>` |
| `getById(p)` | `OrderRefParams` (`{ name, id?, clientId? }`) | `Promise<Order>` |
| `getOpenById(p)` | `OrderRefParams` | `Promise<Order>` (endpoint `/openOrder`) |

```ts
// lectures marché (sorties = types communs Trade / Price)
await dex.native.perp().getAggregateTrades({ name: 'BTCUSDT', limit: 100 });   // Trade[]
await dex.native.perp().getFundingInfo();                                      // FundingConfig[]
await dex.native.perp().getTicker24hr('BTCUSDT');                              // Price[]
// ordres avancés (entrées en vocabulaire commun, sorties = Order)
await dex.native.perp().placeBatch([
  { name: 'BTCUSDT', side: 'buy', type: 'limit', size: '0.001', price: '50000' },
]);                                                                            // Order[]
await dex.native.perp().cancelMany({ name: 'BTCUSDT', ids: ['1', '2'] });      // Order[]
await dex.native.perp().chase({ name: 'BTCUSDT', side: 'buy', size: '0.001' }); // ChaseResult
await dex.native.perp().placeStrategy({
  strategyType: StrategyType.Oto,
  legs: [{ name: 'BTCUSDT', side: 'buy', type: 'limit', size: '0.001', price: '50000' }],
});                                                                            // PlaceStrategyOrderResult
await dex.native.perp().getById({ name: 'BTCUSDT', id: '123' });               // Order
await dex.native.perp().getOpenById({ name: 'BTCUSDT', id: '123' });           // Order
```

## `native.subAccounts()` — `ISubAccountsAdmin`
*(la **liste** est dans `account().getSubAccounts()` ; les **transferts** sont sur `transfers()`.)*
| `bind(p)` | `BindSubAccountParams` | `Promise<CodeMsg>` |
| `create(p)` | `CreateSubAccountParams` | `Promise<CodeMsg>` |
| `update(p)` | `UpdateSubAccountParams` | `Promise<CodeMsg>` |

```ts
await dex.native.subAccounts().create({ subAccountId: 'sub1' });
// Transfert master↔sous-compte : voir transfers() (commun) → dex.transfers().transfer({ to: { subAccount } })
```

## `native.prediction()` — `IPrediction` (marchés de prédiction)
*(host dédié `papi`, **testnet-only** à ce jour. `getExchangeInfo` public ; le reste signé.)*
| Méthode | Entrée | Sortie |
|---|---|---|
| `getExchangeInfo()` | — | `Promise<unknown>` (marchés, statuts, filtres) |
| `getPositions(q?)` | `{ symbol? }` | `Promise<unknown>` |
| `getPositionHistories(q?)` | `{ symbol?; startTime?; endTime?; limit? }` | `Promise<unknown>` |
| `getSettlementHistories(q?)` | `{ symbol?; startTime?; endTime?; limit? }` | `Promise<unknown>` |
| `getTransactionHistory(q?)` | `{ symbol?; startTime?; endTime?; limit? }` | `Promise<unknown>` |
| `mint(p)` | `PredictionMintParams` `{ symbol; quantity; newClientOrderId? }` | `Promise<unknown>` |
| `burn(p)` | `PredictionBurnParams` `{ symbol; quantity; newClientOrderId? }` | `Promise<unknown>` |

```ts
await dex.native.prediction().getExchangeInfo();
await dex.native.prediction().getPositions();
await dex.native.prediction().getPositionHistories({ limit: 50 });
await dex.native.prediction().mint({ symbol: 'BTC_UP_DOWN_…_YUSDT', quantity: '1' });   // émet 1 paire YES+NO
await dex.native.prediction().burn({ symbol: 'BTC_UP_DOWN_…_YUSDT', quantity: '1' });   // brûle 1 paire
```

---

> Types d'I/O détaillés : `src/common/futures.ts` / `src/common/types.ts` (exportés par le package).
> Capacités signées (agents, builders, mmp, modes, account, `native.perp()` ordres avancés,
> subAccounts) validées sur **testnet réel** ; `native.perp()` reads marché sont **publics**.
> `prediction` : host `papi` testnet-only — `getExchangeInfo` public + lectures signées testées sur
> testnet ; `mint`/`burn` (mouvement de quote) testés manuellement.
