import type { AsterClient } from '../common/config';
import type { WebSocketFactory, WebSocketLike } from '../common/config';
import type { JsonValue, KlineInterval } from '../common/types';
import type { DepthLevels, DepthSpeed, FuturesWsOptions } from '../common/ws';
import type { StreamHandler, Unsubscribe } from '../common/ws';
import { resolveReadNetwork } from '../rest/client';
import { SubscriptionBatcher } from './subscription-batcher';
import {
  IDLE_TIMEOUT_MS,
  RECONNECT_BASE_MS,
  RECONNECT_CAP_MS,
  RECONNECT_FACTOR,
  RECONNECT_JITTER,
  RECONNECT_STABLE_MS,
  WS_OPEN,
} from './ws-constants';

/**
 * Client WebSocket des flux de marché futures (`fstream`). Connexion en mode **combined**
 * (`/stream`) : chaque message est dispatché par nom de flux. Les payloads sont délivrés
 * bruts (`JsonValue`), tels qu'Aster les émet. Re-souscription automatique au reconnect.
 *
 * Robustesse (spec commune 4 SDK) : reconnect à backoff exponentiel + jitter + cap, reset du
 * compteur après stabilité, idle-timeout (le serveur Aster/Binance pousse des ping-frames
 * protocolaires, pas de ping JSON applicatif), parsing défensif. Tout est interne ; l'API
 * publique (`subscribeX`/`Unsubscribe`) ne change pas.
 */
export class FuturesWsClient {
  public onMessage: ((message: JsonValue) => void) | null = null;
  public onError: ((error: unknown) => void) | null = null;
  public onClose: (() => void) | null = null;
  public onReconnect: (() => void) | null = null;

  private readonly url: string;
  private readonly createSocket: WebSocketFactory;
  private socket: WebSocketLike | null = null;
  private readonly handlers = new Map<string, Set<StreamHandler>>();
  private shouldReconnect = false;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private lastMessageAt = 0;
  private stableTimer: ReturnType<typeof setTimeout> | null = null;
  /** Coalesce + throttle les SUBSCRIBE/UNSUBSCRIBE (limite Aster : 10 messages/s par connexion). */
  private readonly batcher = new SubscriptionBatcher((frame) => {
    // On n'émet que si la socket COURANTE est réellement OPEN. Le flag `open` du batcher peut être en avance
    // sur l'état réel (reconnexion : `this.socket` réassigné à une socket CONNECTING avant `onopen`) ; s'y fier
    // déclenchait `send()` sur socket non connectée → « Sent before connected » (throw non rattrapé → crash).
    // Une frame non émise n'est pas perdue : `reset()` vide l'outbox au close et `afterReconnect()` rejoue
    // `resubscribe()` à la réouverture.
    if (this.socket !== null && this.socket.readyState === WS_OPEN) {
      this.socket.send(frame);
    }
  });

  constructor(client: AsterClient, options: FuturesWsOptions = {}) {
    this.url =
      options.url ?? `${client.wsUrls.futures[resolveReadNetwork(client, options.label)]}/stream`;
    this.createSocket = options.webSocket ?? client.webSocket;
  }

  public connect(): Promise<void> {
    this.shouldReconnect = true;
    return new Promise((resolve, reject) => {
      const socket = this.createSocket(this.url);
      this.socket = socket;
      socket.onopen = () => {
        this.batcher.setOpen(true);
        this.startHeartbeat();
        this.bumpIdle();
        this.stableTimer = setTimeout(() => {
          this.reconnectAttempts = 0;
          this.stableTimer = null;
        }, RECONNECT_STABLE_MS);
        resolve();
      };
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
    this.stopHeartbeat();
    this.stopIdleTimer();
    if (this.stableTimer !== null) {
      clearTimeout(this.stableTimer);
      this.stableTimer = null;
    }
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.batcher.setOpen(false);
    this.batcher.reset();
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
      this.batcher.subscribe(name);
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
        this.batcher.unsubscribe(name);
      }
    };
  }

  private handleMessage(raw: unknown): void {
    this.bumpIdle();
    let message: JsonValue;
    try {
      message = JSON.parse(String(raw)) as JsonValue;
    } catch {
      if (this.onError !== null) {
        this.onError(new Error('WebSocket : message JSON illisible ignoré'));
      }
      return;
    }
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

  // ── Heartbeat / idle-timeout ───────────────────────────────────────────────
  // Aster/Binance pousse des ping-frames protocolaires : pas de ping JSON applicatif (en émettre
  // un serait rejeté). Le heartbeat se réduit donc à l'idle-timeout (45 s sans message → reconnect).

  private startHeartbeat(): void {
    this.stopHeartbeat();
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private bumpIdle(): void {
    this.lastMessageAt = Date.now();
    this.stopIdleTimer();
    this.idleTimer = setTimeout(() => {
      // Défense contre la dérive du timer (machine en veille…) : on ne force la reconnexion que si
      // l'inactivité réelle (depuis le dernier message) atteint bien le seuil.
      if (Date.now() - this.lastMessageAt >= IDLE_TIMEOUT_MS) {
        this.forceReconnect();
      } else {
        this.bumpIdle();
      }
    }, IDLE_TIMEOUT_MS);
  }

  private stopIdleTimer(): void {
    if (this.idleTimer !== null) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }

  private forceReconnect(): void {
    if (this.socket !== null) {
      this.socket.close();
    }
  }

  private handleClose(): void {
    this.stopHeartbeat();
    this.stopIdleTimer();
    if (this.stableTimer !== null) {
      clearTimeout(this.stableTimer);
      this.stableTimer = null;
    }
    this.socket = null;
    this.batcher.setOpen(false);
    this.batcher.reset();
    if (this.onClose !== null) {
      this.onClose();
    }
    if (this.shouldReconnect === true) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.shouldReconnect === false) {
      return;
    }
    const capped = Math.min(
      RECONNECT_BASE_MS * RECONNECT_FACTOR ** this.reconnectAttempts,
      RECONNECT_CAP_MS,
    );
    const jitter = capped * RECONNECT_JITTER * (2 * Math.random() - 1);
    const delay = Math.max(0, Math.round(capped + jitter));
    this.reconnectAttempts += 1;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect()
        .then(() => this.afterReconnect())
        .catch((error: unknown) => {
          if (this.onError !== null) {
            this.onError(error);
          }
          this.scheduleReconnect();
        });
    }, delay);
  }

  private afterReconnect(): void {
    this.batcher.resubscribe(this.handlers.keys());
    if (this.onReconnect !== null) {
      this.onReconnect();
    }
  }
}

/** Les noms de flux Aster utilisent le symbole en minuscules. */
function stream(symbol: string): string {
  return symbol.toLowerCase();
}
