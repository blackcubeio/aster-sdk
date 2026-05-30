import type { AsterClient } from '../common/config';
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
 * Client WebSocket **unifié Blackcube** (interne ; exposé via `Aster.ws()`). Chaque méthode
 * `subscribeX` délivre au handler le **type unifié déjà converti** (`Candle`, `OrderBook`…).
 *
 * Aster expose nativement plusieurs sockets ; ce client les **agrège** : flux de marché
 * `futures`/`spot` routés par `kind`, + user-data multiplexé (listenKey).
 *
 * **Connexion automatique** : chaque socket est ouvert paresseusement à sa 1ʳᵉ souscription et
 * fermé dès que son dernier abonnement est retiré (ref-counting). Le développeur ne gère que
 * `subscribeX(…) → unsubscribe()`. Converters WS **unidirectionnels** (lecture seule).
 */
export class UnifiedWsClient {
  private readonly client: AsterClient;
  private readonly label: string | undefined;

  private futures: FuturesWsClient | null = null;
  private spot: SpotWsClient | null = null;
  private futuresRefs = 0;
  private spotRefs = 0;

  private userData: FuturesUserDataStream | null = null;
  private userDataPromise: Promise<FuturesUserDataStream> | null = null;
  private userDataRefs = 0;

  constructor(client: AsterClient, label?: string) {
    this.client = client;
    this.label = label;
  }

  /** Ouvre (lazy) le socket de marché du produit et renvoie le client connecté. */
  private marketClient(kind: MarketKind): FuturesWsClient | SpotWsClient {
    if (kind === 'spot') {
      if (this.spot === null) {
        this.spot = new SpotWsClient(this.client, { label: this.label });
        void this.spot.connect();
      }
      this.spotRefs += 1;
      return this.spot;
    }
    if (this.futures === null) {
      this.futures = new FuturesWsClient(this.client, { label: this.label });
      void this.futures.connect();
    }
    this.futuresRefs += 1;
    return this.futures;
  }

  /** Décrémente le ref-count d'un socket de marché et le ferme s'il tombe à zéro. */
  private releaseMarket(kind: MarketKind): void {
    if (kind === 'spot') {
      this.spotRefs -= 1;
      if (this.spotRefs <= 0 && this.spot !== null) {
        this.spot.disconnect();
        this.spot = null;
        this.spotRefs = 0;
      }
      return;
    }
    this.futuresRefs -= 1;
    if (this.futuresRefs <= 0 && this.futures !== null) {
      this.futures.disconnect();
      this.futures = null;
      this.futuresRefs = 0;
    }
  }

  /** Souscription de marché ref-comptée : ouvre le socket au 1er abonné, ferme au dernier. */
  private subscribeMarket<T>(
    kind: MarketKind,
    subscribe: (client: FuturesWsClient | SpotWsClient) => Unsubscribe,
  ): Unsubscribe {
    const off = subscribe(this.marketClient(kind));
    let released = false;
    return () => {
      if (released === true) {
        return;
      }
      released = true;
      off();
      this.releaseMarket(kind);
    };
  }

  /** Ouvre (une seule fois) le stream user-data futures : crée le listenKey puis connecte. */
  private ensureUserData(): Promise<FuturesUserDataStream> {
    if (this.label === undefined) {
      return Promise.reject(new Error('user-data: un `label` (signer) est requis'));
    }
    if (this.userDataPromise === null) {
      const label = this.label;
      this.userDataPromise = createListenKey(this.client, label).then(({ listenKey }) => {
        const stream = new FuturesUserDataStream(this.client, listenKey, { label });
        this.userData = stream;
        return stream.connect().then(() => stream);
      });
    }
    return this.userDataPromise;
  }

  /** Branche un handler user-data (lazy-connect) ; ferme le stream au dernier désabonnement. */
  private onUserData(eventType: string, handler: (msg: unknown) => void): Unsubscribe {
    let off: Unsubscribe = () => {};
    let cancelled = false;
    this.userDataRefs += 1;
    this.ensureUserData()
      .then((stream) => {
        if (cancelled === false) {
          off = stream.on(eventType, (event) => handler(event));
        }
      })
      .catch(() => {});
    return () => {
      if (cancelled === true) {
        return;
      }
      cancelled = true;
      off();
      this.userDataRefs -= 1;
      if (this.userDataRefs <= 0 && this.userData !== null) {
        this.userData.disconnect();
        this.userData = null;
        this.userDataPromise = null;
        this.userDataRefs = 0;
      }
    };
  }

  /** Bougies temps réel. `kind` (défaut `perp`) route futures/spot et annote la bougie. */
  public subscribeCandles(
    params: { name: string; interval: string; kind?: MarketKind },
    handler: (candle: Candle) => void,
  ): Unsubscribe {
    const kind = params.kind ?? 'perp';
    const converter = new CandleWsConverter(kind);
    return this.subscribeMarket(kind, (client) =>
      client.subscribeKline(params.name, params.interval as KlineInterval, (raw) => {
        handler(converter.toCommon(raw as unknown as KlineWsNative));
      }),
    );
  }

  /** Trades publics temps réel (agrégés). `kind` (défaut `perp`) route futures/spot. */
  public subscribeTrades(
    params: { name: string; kind?: MarketKind },
    handler: (trade: Trade) => void,
  ): Unsubscribe {
    const kind = params.kind ?? 'perp';
    const converter = new TradeWsConverter();
    return this.subscribeMarket(kind, (client) =>
      client.subscribeAggTrade(params.name, (raw) => {
        handler(converter.toCommon(raw as unknown as AggTradeWsNative));
      }),
    );
  }

  /** Meilleure limite (BBO) temps réel → {@link OrderBook} (1 niveau par côté). */
  public subscribeBbo(
    params: { name: string; kind?: MarketKind },
    handler: (book: OrderBook) => void,
  ): Unsubscribe {
    const kind = params.kind ?? 'perp';
    const converter = new BboWsConverter(kind);
    return this.subscribeMarket(kind, (client) =>
      client.subscribeBookTicker(params.name, (raw) => {
        handler(converter.toCommon(raw as unknown as BookTickerWsNative));
      }),
    );
  }

  /** Carnet d'ordres (L2) temps réel → {@link OrderBook} (snapshot partiel 20 niveaux). */
  public subscribeOrderBook(
    params: { name: string; kind?: MarketKind },
    handler: (book: OrderBook) => void,
  ): Unsubscribe {
    const kind = params.kind ?? 'perp';
    const converter = new OrderBookWsConverter(kind);
    return this.subscribeMarket(kind, (client) =>
      client.subscribePartialDepth(params.name, 20, (raw) => {
        handler(converter.toCommon(raw as unknown as DepthWsNative));
      }),
    );
  }

  /**
   * Prix de tous les marchés (snapshot) : le handler reçoit un `Price[]` à chaque message.
   * Source = `allMarkPrices` (mark/oracle/funding) ; perps uniquement.
   */
  public subscribePrices(handler: (prices: Price[]) => void): Unsubscribe {
    const converter = new PricesWsConverter('perp');
    return this.subscribeMarket('perp', (client) =>
      (client as FuturesWsClient).subscribeAllMarkPrices((raw) => {
        handler(converter.toCommon(raw as unknown as MarkPriceWsNative[]));
      }),
    );
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
