import type { WebSocketFactory } from '../common/config';
import type { Candle, KlineInterval, MarketKind, OrderBook, Trade } from '../common/types';
import { type BookTickerWsNative, BboWsConverter } from './converters/bbo';
import { CandleWsConverter, type KlineWsNative } from './converters/candle';
import { type AggTradeWsNative, TradeWsConverter } from './converters/trade';
import { FuturesWsClient } from './futures-client';
import { SpotWsClient } from './spot-client';
import type { Unsubscribe } from './types';

export interface UnifiedWsOptions {
  /** Label du signer : choisit le réseau (défaut mainnet). */
  label?: string;
  webSocket?: WebSocketFactory;
}

/**
 * Client WebSocket **unifié Blackcube** : surface identique entre les SDK. Chaque méthode
 * `subscribeX` délivre au handler le **type unifié déjà converti** (`Candle`, `OrderBook`…).
 *
 * Aster expose nativement plusieurs sockets ; ce client les **agrège** : flux de marché
 * `futures`/`spot` routés par `kind` (+ user-data multiplexé, à venir). `connect()` ouvre
 * les deux sockets de marché publics. Converters WS **unidirectionnels** (`toCommon` seul) :
 * le flux est en lecture seule.
 */
export class UnifiedWsClient {
  private readonly futures: FuturesWsClient;
  private readonly spot: SpotWsClient;

  constructor(options: UnifiedWsOptions = {}) {
    this.futures = new FuturesWsClient(options);
    this.spot = new SpotWsClient(options);
  }

  public async connect(): Promise<void> {
    await Promise.all([this.futures.connect(), this.spot.connect()]);
  }

  public disconnect(): void {
    this.futures.disconnect();
    this.spot.disconnect();
  }

  /** Bougies temps réel. `kind` (défaut `perp`) route futures/spot et annote la bougie. */
  public subscribeCandles(
    params: { name: string; interval: string; kind?: MarketKind },
    handler: (candle: Candle) => void,
  ): Unsubscribe {
    const kind = params.kind ?? 'perp';
    const converter = new CandleWsConverter(kind);
    const client = kind === 'spot' ? this.spot : this.futures;
    return client.subscribeKline(params.name, params.interval as KlineInterval, (raw) => {
      handler(converter.toCommon(raw as unknown as KlineWsNative));
    });
  }

  /** Trades publics temps réel (agrégés). `kind` (défaut `perp`) route futures/spot. */
  public subscribeTrades(
    params: { name: string; kind?: MarketKind },
    handler: (trade: Trade) => void,
  ): Unsubscribe {
    const converter = new TradeWsConverter();
    const client = (params.kind ?? 'perp') === 'spot' ? this.spot : this.futures;
    return client.subscribeAggTrade(params.name, (raw) => {
      handler(converter.toCommon(raw as unknown as AggTradeWsNative));
    });
  }

  /** Meilleure limite (BBO) temps réel → {@link OrderBook} (1 niveau par côté). */
  public subscribeBbo(
    params: { name: string; kind?: MarketKind },
    handler: (book: OrderBook) => void,
  ): Unsubscribe {
    const kind = params.kind ?? 'perp';
    const converter = new BboWsConverter(kind);
    const client = kind === 'spot' ? this.spot : this.futures;
    return client.subscribeBookTicker(params.name, (raw) => {
      handler(converter.toCommon(raw as unknown as BookTickerWsNative));
    });
  }
}
