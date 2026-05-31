# Surface `native` — spécifique à `@blackcube/aster-sdk`

Capacités **propres à Aster**, hors contrat unifié (voir [`common.md`](common.md) pour le portable).
Accès uniforme à tous les SDK : **`dex.native.<capacité>(label?)`**. Les noms d'interfaces (`IAgents`,
`IMmp`…) et de méthodes sont **identiques entre SDK** ; seuls les types de params diffèrent.

```ts
const dex = new Aster({ desk: signer }, { default: 'desk' });
dex.native.agents().list();
```

`label?` choisit le signer (défaut : signer par défaut). Lectures signées comprises (compte privé).

---

## `native.agents()` — `IAgents` (API wallets / agents)
| Méthode | Entrée | Sortie |
|---|---|---|
| `list()` | — | `Promise<Agent[]>` |
| `approve(p)` | `ApproveAgentParams` | `Promise<CodeMsg>` |
| `register(p)` | `RegisterAndApproveAgentParams` | `Promise<CodeMsg>` |
| `update(p)` | `UpdateAgentParams` | `Promise<CodeMsg>` |
| `revoke(agentAddress)` | `string` | `Promise<CodeMsg>` |

```ts
await dex.native.agents().list();
await dex.native.agents().approve({ agentAddress: '0x…', agentName: 'bot' });
await dex.native.agents().register({ agentAddress: '0x…' });
await dex.native.agents().update({ agentAddress: '0x…', agentName: 'bot2' });
await dex.native.agents().revoke('0x…');
```

## `native.builders()` — `IBuilders` (fee builders)
| `list()` | — | `Promise<Builder[]>` |
| `approve(p)` | `ApproveBuilderParams` | `Promise<CodeMsg>` |
| `update(p)` | `UpdateBuilderParams` | `Promise<CodeMsg>` |
| `revoke(builder)` | `string` | `Promise<CodeMsg>` |

```ts
await dex.native.builders().list();
await dex.native.builders().approve({ builder: '0x…', maxFeeRate: '0.001' });
await dex.native.builders().revoke('0x…');
```

## `native.mmp()` — `IMmp` (market-maker protection)
| `get(symbol?)` | `string?` | `Promise<MmpConfig[]>` |
| `set(p)` | `UpdateMmpParams` | `Promise<boolean>` |
| `reset(symbol)` | `string` | `Promise<boolean>` |
| `remove(symbol)` | `string` | `Promise<boolean>` |

```ts
await dex.native.mmp().get('BTCUSDT');
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
| `setStp(mode)` | `StpMode` | `Promise<CodeMsg>` |

```ts
await dex.native.modes().getMultiAssets();           // { multiAssetsMargin: true }
await dex.native.modes().setMultiAssets(false);
await dex.native.modes().getPosition();              // { dualSidePosition: false }
await dex.native.modes().setPosition(true);          // hedge mode
await dex.native.modes().getStp();                   // { stpMode: 'EXPIRE_MAKER' }
await dex.native.modes().setStp('EXPIRE_TAKER');
```

## `native.analytics()` — `IAnalytics` (lectures de compte)
| `forceOrders(query?)` | `ForceOrdersQuery?` | `Promise<OrderDetail[]>` |
| `adlQuantile(symbol?)` | `string?` | `Promise<AdlQuantile[]>` |
| `commissionRate(symbol)` | `string` | `Promise<CommissionRate>` |
| `income(query?)` | `IncomeQuery?` | `Promise<IncomeEntry[]>` |
| `leverageBracket(symbol?)` | `string?` | `Promise<LeverageBracket \| LeverageBracket[]>` |
| `marginHistory(query)` | `PositionMarginHistoryQuery` | `Promise<PositionMarginHistoryEntry[]>` |

```ts
await dex.native.analytics().commissionRate('BTCUSDT'); // { makerCommissionRate, takerCommissionRate }
await dex.native.analytics().income({ incomeType: 'FUNDING_FEE', limit: 100 });
await dex.native.analytics().leverageBracket('BTCUSDT');
await dex.native.analytics().adlQuantile();
await dex.native.analytics().forceOrders();
await dex.native.analytics().marginHistory({ symbol: 'BTCUSDT' });
```

## `native.marketData()` — `IMarketDataExtra` (marché, **public**)
| `aggTrades(query)` | `AggTradesQuery` | `Promise<AggTrade[]>` |
| `historicalTrades(query)` | `HistoricalTradesQuery` | `Promise<MarketTrade[]>` |
| `fundingInfo(symbol?)` | `string?` | `Promise<FundingInfo[]>` |
| `indexPriceReferences(symbol)` | `string` | `Promise<IndexPriceReferences>` |
| `ticker24hr(symbol?)` | `string?` | `Promise<Ticker24hr \| Ticker24hr[]>` |

```ts
await dex.native.marketData().aggTrades({ symbol: 'BTCUSDT', limit: 100 });
await dex.native.marketData().historicalTrades({ symbol: 'BTCUSDT', limit: 100 });
await dex.native.marketData().fundingInfo();
await dex.native.marketData().indexPriceReferences('BTCUSDT');
await dex.native.marketData().ticker24hr('BTCUSDT');
```

## `native.advancedOrders()` — `IAdvancedOrders`
| `placeBatch(orders)` | `NewOrderParams[]` | `Promise<BatchOrderResult[]>` |
| `cancelMany(p)` | `CancelMultipleOrdersParams` | `Promise<BatchOrderResult[]>` |
| `chase(p)` | `ChaseOrderParams` | `Promise<ChaseOrder>` |
| `placeStrategy(p)` | `PlaceStrategyOrderParams` | `Promise<PlaceStrategyOrderResult>` |
| `updateStrategy(p)` | `UpdateStrategyOrderParams` | `Promise<UpdateStrategyOrderResult[]>` |
| `strategyOpen(query)` | `StrategyOrderQuery` | `Promise<StrategyOrder>` |
| `strategyHistory(query)` | `StrategyHistoryQuery` | `Promise<StrategyOrder>` |
| `query(p)` | `OrderQuery` | `Promise<OrderDetail>` |
| `getOpen(p)` | `OrderQuery` | `Promise<OrderDetail>` |

```ts
await dex.native.advancedOrders().placeBatch([
  { symbol: 'BTCUSDT', side: 'BUY', type: 'LIMIT', quantity: '0.001', price: '50000' },
]);
await dex.native.advancedOrders().cancelMany({ symbol: 'BTCUSDT', orderIdList: [1, 2] });
await dex.native.advancedOrders().chase({ symbol: 'BTCUSDT', side: 'BUY', quantity: '0.001' });
await dex.native.advancedOrders().placeStrategy({ symbol: 'BTCUSDT', strategyType: 'TWAP', side: 'BUY', quantity: '1', durationSec: 3600 });
await dex.native.advancedOrders().query({ symbol: 'BTCUSDT', orderId: 123 });
await dex.native.advancedOrders().getOpen({ symbol: 'BTCUSDT', orderId: 123 });
```

## `native.subAccounts()` — `ISubAccountsAdmin`
*(la **liste** des sous-comptes est dans `account().getSubAccounts()`.)*
| `bind(p)` | `BindSubAccountParams` | `Promise<CodeMsg>` |
| `create(p)` | `CreateSubAccountParams` | `Promise<CodeMsg>` |
| `update(p)` | `UpdateSubAccountParams` | `Promise<CodeMsg>` |
| `transfer(p)` | `SubAccountTransferParams` | `Promise<CodeMsg>` |
| `transferFuturesSpot(p)` | `TransferParams` | `Promise<TransferResult>` |

```ts
await dex.native.subAccounts().create({ subAccountId: 'sub1' });
await dex.native.subAccounts().transfer({ from: 'main', to: 'sub1', asset: 'USDT', amount: '100' });
await dex.native.subAccounts().transferFuturesSpot({ asset: 'USDT', amount: '50', type: 1 });
```

---

> Types d'I/O détaillés : `src/common/futures.ts` / `src/common/types.ts` (exportés par le package).
> Capacités signées (agents, builders, mmp, modes, analytics, advancedOrders, subAccounts) validées
> sur **testnet réel** ; `marketData` est **public**.
