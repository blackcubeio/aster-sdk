import { type WebSocketFactory, type WebSocketLike, getConfig } from '../common/config';
import type { JsonObject, JsonValue, KlineInterval } from '../common/types';
import type { SpotDepthLevels, SpotWsOptions } from '../common/ws';
import type { StreamHandler, Unsubscribe } from '../common/ws';
import { resolveReadNetwork } from '../rest/client';

/**
 * Client WebSocket des flux de marché spot (`sstream`), mode **combined** (`/stream`).
 * Dispatch par nom de flux ; payloads bruts (`JsonValue`). Re-souscription au reconnect.
 */
export class SpotWsClient {
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

  constructor(options: SpotWsOptions = {}) {
    const config = getConfig();
    this.url = options.url ?? `${config.wsUrls.spot[resolveReadNetwork(options.label)]}/stream`;
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

  public subscribeTrade(symbol: string, handler: StreamHandler): Unsubscribe {
    return this.subscribeStream(`${stream(symbol)}@trade`, handler);
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

  public subscribePartialDepth(
    symbol: string,
    levels: SpotDepthLevels,
    handler: StreamHandler,
    fast = false,
  ): Unsubscribe {
    return this.subscribeStream(
      `${stream(symbol)}@depth${levels}${fast === true ? '@100ms' : ''}`,
      handler,
    );
  }

  public subscribeDiffDepth(symbol: string, handler: StreamHandler, fast = false): Unsubscribe {
    return this.subscribeStream(`${stream(symbol)}@depth${fast === true ? '@100ms' : ''}`, handler);
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
