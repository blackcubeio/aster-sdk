# Surface `native` — spécifique à `@blackcube/aster-sdk`

Capacités **propres à Aster**, hors contrat unifié (voir [`common.md`](common.md) pour le portable).
Accès uniforme à tous les SDK : **`dex.native.<capacité>(label?)`**. Les noms d'interfaces (`IAgents`,
`IMmp`…) et de méthodes sont **identiques entre SDK** ; seuls les types de params diffèrent.

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
| `getForceOrders(query?)` | `ForceOrdersQuery?` | `Promise<OrderDetail[]>` |
| `getAdlQuantile(symbol?)` | `string?` | `Promise<AdlQuantile[]>` |
| `getCommissionRate(symbol)` | `string` | `Promise<CommissionRate>` |
| `getIncome(query?)` | `IncomeQuery?` | `Promise<IncomeEntry[]>` |
| `getLeverageBracket(symbol?)` | `string?` | `Promise<LeverageBracket \| LeverageBracket[]>` |
| `getMarginHistory(query)` | `PositionMarginHistoryQuery` | `Promise<PositionMarginHistoryEntry[]>` |

```ts
await dex.native.account().getCommissionRate('BTCUSDT'); // { makerCommissionRate, takerCommissionRate }
await dex.native.account().getIncome({ incomeType: 'FUNDING_FEE', limit: 100 });
await dex.native.account().getLeverageBracket('BTCUSDT');
await dex.native.account().getAdlQuantile();
await dex.native.account().getForceOrders();
await dex.native.account().getMarginHistory({ symbol: 'BTCUSDT' });
```

## `native.marketData()` — `INativeMarket` (marché, **public**)
| `getAggregateTrades(query)` | `AggregateTradesParams` | `Promise<AggTrade[]>` |
| `getHistoricalTrades(query)` | `HistoricalTradesParams` | `Promise<MarketTrade[]>` |
| `getFundingInfo(symbol?)` | `string?` | `Promise<FundingInfo[]>` |
| `getIndexPriceReferences(symbol)` | `string` | `Promise<IndexPriceReferences>` |
| `getTicker24hr(symbol?)` | `string?` | `Promise<Ticker24hr \| Ticker24hr[]>` |

```ts
await dex.native.marketData().getAggregateTrades({ symbol: 'BTCUSDT', limit: 100 });
await dex.native.marketData().getHistoricalTrades({ symbol: 'BTCUSDT', limit: 100 });
await dex.native.marketData().getFundingInfo();
await dex.native.marketData().getIndexPriceReferences('BTCUSDT');
await dex.native.marketData().getTicker24hr('BTCUSDT');
```

## Surplus ordres — `INativeOrders`, porté par `perp()` / `spot()`

> Le surplus **ordres** (batch / chase / stratégies / lecture par id) n'a **pas** de scope `native`
> dédié : il est exposé sur le scope marché `dex.perp()` / `dex.spot()`, aux côtés des verbes communs
> (`place`/`cancel`/`edit`…).

| Méthode | Entrée | Sortie |
|---|---|---|
| `placeBatch(orders)` | `PlaceBatch` | `Promise<BatchOrderResult[]>` |
| `cancelMany(p)` | `CancelMany` | `Promise<BatchOrderResult[]>` |
| `chase(p)` | `Chase` | `Promise<ChaseOrder>` |
| `placeStrategy(p)` | `PlaceStrategy` | `Promise<PlaceStrategyOrderResult>` |
| `editStrategy(p)` | `UpdateStrategy` | `Promise<UpdateStrategyOrderResult[]>` |
| `getStrategies(query)` | `StrategyOrderQuery` | `Promise<StrategyOrder>` |
| `getStrategyHistory(query)` | `StrategyHistoryQuery` | `Promise<StrategyOrder>` |
| `getById(p)` | `OrderQuery` | `Promise<OrderDetail>` |
| `getOpenById(p)` | `OrderQuery` | `Promise<OrderDetail>` (endpoint `/openOrder`) |

```ts
await dex.perp().placeBatch([
  { symbol: 'BTCUSDT', side: 'BUY', type: 'LIMIT', quantity: '0.001', price: '50000' },
]);
await dex.perp().cancelMany({ symbol: 'BTCUSDT', orderIdList: [1, 2] });
await dex.perp().chase({ symbol: 'BTCUSDT', side: 'BUY', quantity: '0.001' });
await dex.perp().placeStrategy({ symbol: 'BTCUSDT', strategyType: 'TWAP', side: 'BUY', quantity: '1', durationSec: 3600 });
await dex.perp().getById({ symbol: 'BTCUSDT', orderId: 123 });
await dex.perp().getOpenById({ symbol: 'BTCUSDT', orderId: 123 });
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
> Capacités signées (agents, builders, mmp, modes, account, surplus ordres sur `perp()`/`spot()`,
> subAccounts) validées sur **testnet réel** ; `marketData` est **public**. `prediction` : host `papi` testnet-only — `getExchangeInfo`
> public + lectures signées testées sur testnet ; `mint`/`burn` (mouvement de quote) testés manuellement.
