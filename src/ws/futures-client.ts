import { type WebSocketFactory, type WebSocketLike, getConfig } from '../common/config';
import type { JsonObject, JsonValue, KlineInterval } from '../common/types';
import { resolveReadNetwork } from '../rest/client';
import type { StreamHandler, Unsubscribe } from './types';

/** Vitesse de rafraîchissement optionnelle des flux de profondeur. */
export type DepthSpeed = '100ms' | '500ms';
/** Niveaux d'un flux de profondeur partielle. */
export type DepthLevels = 5 | 10 | 20;

export interface FuturesWsOptions {
  url?: string;
  webSocket?: WebSocketFactory;
  /** Label du signer : choisit le réseau (défaut mainnet). */
  label?: string;
}

/**
 * Client WebSocket des flux de marché futures (`fstream`). Connexion en mode **combined**
 * (`/stream`) : chaque message est dispatché par nom de flux. Les payloads sont délivrés
 * bruts (`JsonValue`), tels qu'Aster les émet. Re-souscription automatique au reconnect.
 */
export class FuturesWsClient {
  public onMessage: ((message: JsonValue) => void) | null = null;
  public onError: ((error: unknown) => void) | null = null;
  public onClose: (() => void) | null = null;
  public onReconnect: (() => void) | null = null;

  private readonly url: string;
  private readonly createSocket: WebSocketFactory;
  private socket: WebSocketLike | null = null;
  private nextId = 1;
  private readonly handlers = new Map<string, Set<StreamHandler>>();
  private shouldReconnect = false;

  constructor(options: FuturesWsOptions = {}) {
    const config = getConfig();
    this.url = options.url ?? `${config.wsUrls.futures[resolveReadNetwork(options.label)]}/stream`;
    this.createSocket = options.webSocket ?? config.webSocket;
  }

  public connect(): Promise<void> {
    this.shouldReconnect = true;
    return new Promise((resolve, reject) => {
      const socket = this.createSocket(this.url);
      this.socket = socket;
      socket.onopen = () => resolve();
      socket.onmessage = (event) => this.handleMessage(event.data);
      socket.onerror = (error) => {
        if (this.onError !== null) {
          this.onError(error);
        }
        reject(error);
      };
      socket.onclose = () => this.handleClose();
    });
  }

  public disconnect(): void {
    this.shouldReconnect = false;
    if (this.socket !== null) {
      this.socket.close();
      this.socket = null;
    }
  }

  public subscribeAggTrade(symbol: string, handler: StreamHandler): Unsubscribe {
    return this.subscribeStream(`${stream(symbol)}@aggTrade`, handler);
  }

  public subscribeMarkPrice(symbol: string, handler: StreamHandler, fast = false): Unsubscribe {
    return this.subscribeStream(
      `${stream(symbol)}@markPrice${fast === true ? '@1s' : ''}`,
      handler,
    );
  }

  public subscribeAllMarkPrices(handler: StreamHandler, fast = false): Unsubscribe {
    return this.subscribeStream(`!markPrice@arr${fast === true ? '@1s' : ''}`, handler);
  }

  public subscribeKline(
    symbol: string,
    interval: KlineInterval,
    handler: StreamHandler,
  ): Unsubscribe {
    return this.subscribeStream(`${stream(symbol)}@kline_${interval}`, handler);
  }

  public subscribeMiniTicker(symbol: string, handler: StreamHandler): Unsubscribe {
    return this.subscribeStream(`${stream(symbol)}@miniTicker`, handler);
  }

  public subscribeAllMiniTickers(handler: StreamHandler): Unsubscribe {
    return this.subscribeStream('!miniTicker@arr', handler);
  }

  public subscribeTicker(symbol: string, handler: StreamHandler): Unsubscribe {
    return this.subscribeStream(`${stream(symbol)}@ticker`, handler);
  }

  public subscribeAllTickers(handler: StreamHandler): Unsubscribe {
    return this.subscribeStream('!ticker@arr', handler);
  }

  public subscribeBookTicker(symbol: string, handler: StreamHandler): Unsubscribe {
    return this.subscribeStream(`${stream(symbol)}@bookTicker`, handler);
  }

  public subscribeAllBookTickers(handler: StreamHandler): Unsubscribe {
    return this.subscribeStream('!bookTicker', handler);
  }

  public subscribeForceOrder(symbol: string, handler: StreamHandler): Unsubscribe {
    return this.subscribeStream(`${stream(symbol)}@forceOrder`, handler);
  }

  public subscribeAllForceOrders(handler: StreamHandler): Unsubscribe {
    return this.subscribeStream('!forceOrder@arr', handler);
  }

  public subscribePartialDepth(
    symbol: string,
    levels: DepthLevels,
    handler: StreamHandler,
    speed?: DepthSpeed,
  ): Unsubscribe {
    const suffix = speed === undefined ? '' : `@${speed}`;
    return this.subscribeStream(`${stream(symbol)}@depth${levels}${suffix}`, handler);
  }

  public subscribeDiffDepth(
    symbol: string,
    handler: StreamHandler,
    speed?: DepthSpeed,
  ): Unsubscribe {
    const suffix = speed === undefined ? '' : `@${speed}`;
    return this.subscribeStream(`${stream(symbol)}@depth${suffix}`, handler);
  }

  private subscribeStream(name: string, handler: StreamHandler): Unsubscribe {
    let handlerSet = this.handlers.get(name);
    if (handlerSet === undefined) {
      handlerSet = new Set();
      this.handlers.set(name, handlerSet);
      this.send({ method: 'SUBSCRIBE', params: [name], id: this.nextId++ });
    }
    handlerSet.add(handler);
    return () => {
      const set = this.handlers.get(name);
      if (set === undefined) {
        return;
      }
      set.delete(handler);
      if (set.size === 0) {
        this.handlers.delete(name);
        this.send({ method: 'UNSUBSCRIBE', params: [name], id: this.nextId++ });
      }
    };
  }

  private send(payload: JsonObject): void {
    if (this.socket === null) {
      throw new Error('WebSocket is not connected; call connect() first');
    }
    this.socket.send(JSON.stringify(payload));
  }

  private handleMessage(raw: unknown): void {
    const message = JSON.parse(String(raw)) as JsonValue;
    if (this.onMessage !== null) {
      this.onMessage(message);
    }
    if (typeof message !== 'object' || message === null || Array.isArray(message) === true) {
      return;
    }
    const streamName = message.stream;
    if (typeof streamName === 'string') {
      this.dispatch(streamName, message.data ?? null);
    }
  }

  private dispatch(name: string, data: JsonValue): void {
    const handlerSet = this.handlers.get(name);
    if (handlerSet !== undefined) {
      for (const handler of handlerSet) {
        handler(data);
      }
    }
  }

  private handleClose(): void {
    this.socket = null;
    if (this.onClose !== null) {
      this.onClose();
    }
    if (this.shouldReconnect === true) {
      this.reconnect();
    }
  }

  private reconnect(): void {
    this.connect()
      .then(() => {
        for (const name of this.handlers.keys()) {
          this.send({ method: 'SUBSCRIBE', params: [name], id: this.nextId++ });
        }
        if (this.onReconnect !== null) {
          this.onReconnect();
        }
      })
      .catch((error: unknown) => {
        if (this.onError !== null) {
          this.onError(error);
        }
      });
  }
}

/** Les noms de flux Aster utilisent le symbole en minuscules. */
function stream(symbol: string): string {
  return symbol.toLowerCase();
}
