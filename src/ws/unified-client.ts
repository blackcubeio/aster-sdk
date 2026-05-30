import type { WebSocketFactory } from '../common/config';
import type {
  Candle,
  KlineInterval,
  MarketKind,
  Order,
  OrderBook,
  Position,
  Price,
  Trade,
  UserTrade,
} from '../common/types';
import type { UnifiedWsOptions } from '../common/ws';
import type { Unsubscribe } from '../common/ws';
import { BboWsConverter, type BookTickerWsNative } from '../converters/bbo';
import { CandleWsConverter, type KlineWsNative } from '../converters/candle';
import { type OrderTradeUpdateWsNative, OrderWsConverter } from '../converters/order';
import { type DepthWsNative, OrderBookWsConverter } from '../converters/order-book';
import { type AccountPositionWsNative, PositionWsConverter } from '../converters/position';
import { type MarkPriceWsNative, PricesWsConverter } from '../converters/price';
import { type AggTradeWsNative, TradeWsConverter } from '../converters/trade';
import { type OrderTradeFillWsNative, UserTradeWsConverter } from '../converters/user-trade';
import { createListenKey } from '../rest/futures/user-stream/listen-key';
import { FuturesWsClient } from './futures-client';
import { FuturesUserDataStream } from './futures-user-data';
import { SpotWsClient } from './spot-client';

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
  private readonly label: string | undefined;
  /** Stream user-data (1 socket multiplexé), connecté paresseusement à la 1re souscription compte. */
  private userData: FuturesUserDataStream | null = null;
  private userDataPromise: Promise<FuturesUserDataStream> | null = null;

  constructor(options: UnifiedWsOptions = {}) {
    this.futures = new FuturesWsClient(options);
    this.spot = new SpotWsClient(options);
    this.label = options.label;
  }

  public async connect(): Promise<void> {
    await Promise.all([this.futures.connect(), this.spot.connect()]);
  }

  public disconnect(): void {
    this.futures.disconnect();
    this.spot.disconnect();
    if (this.userData !== null) {
      this.userData.disconnect();
      this.userData = null;
      this.userDataPromise = null;
    }
  }

  /** Ouvre (une seule fois) le stream user-data futures : crée le listenKey puis connecte. */
  private ensureUserData(): Promise<FuturesUserDataStream> {
    if (this.label === undefined) {
      return Promise.reject(new Error('user-data: un `label` (signer) est requis'));
    }
    if (this.userDataPromise === null) {
      const label = this.label;
      this.userDataPromise = createListenKey(label).then(({ listenKey }) => {
        const stream = new FuturesUserDataStream(listenKey, { label });
        this.userData = stream;
        return stream.connect().then(() => stream);
      });
    }
    return this.userDataPromise;
  }

  /** Branche un handler d'event user-data dès que le stream est prêt (désabonnement sync). */
  private onUserData(eventType: string, handler: (msg: unknown) => void): Unsubscribe {
    let off: Unsubscribe = () => {};
    let cancelled = false;
    this.ensureUserData()
      .then((stream) => {
        if (cancelled === false) {
          off = stream.on(eventType, (event) => handler(event));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      off();
    };
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

  /** Carnet d'ordres (L2) temps réel → {@link OrderBook} (snapshot partiel 20 niveaux). */
  public subscribeOrderBook(
    params: { name: string; kind?: MarketKind },
    handler: (book: OrderBook) => void,
  ): Unsubscribe {
    const kind = params.kind ?? 'perp';
    const converter = new OrderBookWsConverter(kind);
    if (kind === 'spot') {
      return this.spot.subscribePartialDepth(params.name, 20, (raw) => {
        handler(converter.toCommon(raw as unknown as DepthWsNative));
      });
    }
    return this.futures.subscribePartialDepth(params.name, 20, (raw) => {
      handler(converter.toCommon(raw as unknown as DepthWsNative));
    });
  }

  /**
   * Prix de tous les marchés (snapshot) : le handler reçoit un `Price[]` à chaque message.
   * Source = `allMarkPrices` (mark/oracle/funding) ; perps uniquement.
   */
  public subscribePrices(handler: (prices: Price[]) => void): Unsubscribe {
    const converter = new PricesWsConverter('perp');
    return this.futures.subscribeAllMarkPrices((raw) => {
      handler(converter.toCommon(raw as unknown as MarkPriceWsNative[]));
    });
  }

  /**
   * Mises à jour d'ordres du compte (user-data) : le handler est appelé **une fois par ordre**.
   * Démux de `ORDER_TRADE_UPDATE` sur le stream futures (listenKey du signer `label`).
   * `user` est ignoré (Aster lie le stream au `label`).
   */
  public subscribeOrders(_params: { user?: string }, handler: (order: Order) => void): Unsubscribe {
    const converter = new OrderWsConverter();
    return this.onUserData('ORDER_TRADE_UPDATE', (msg) => {
      handler(converter.toCommon(msg as OrderTradeUpdateWsNative));
    });
  }

  /**
   * Fills du compte (user-data) : le handler est appelé **une fois par fill**. Démux des
   * `ORDER_TRADE_UPDATE` de type `TRADE` (les `NEW`/`CANCELED` sont ignorés). `user` ignoré.
   */
  public subscribeUserTrades(
    _params: { user?: string },
    handler: (trade: UserTrade) => void,
  ): Unsubscribe {
    const converter = new UserTradeWsConverter();
    return this.onUserData('ORDER_TRADE_UPDATE', (msg) => {
      const event = msg as OrderTradeFillWsNative;
      if (event.o?.x === 'TRADE') {
        handler(converter.toCommon(event));
      }
    });
  }

  /**
   * Positions du compte (user-data) : le handler est appelé **une fois par position** modifiée.
   * Démux de `ACCOUNT_UPDATE.a.P`. `user` ignoré (stream lié au `label`).
   */
  public subscribePositions(
    _params: { user?: string },
    handler: (position: Position) => void,
  ): Unsubscribe {
    const converter = new PositionWsConverter();
    return this.onUserData('ACCOUNT_UPDATE', (msg) => {
      const positions = (msg as { a?: { P?: AccountPositionWsNative[] } }).a?.P ?? [];
      for (const native of positions) {
        handler(converter.toCommon(native));
      }
    });
  }
}
