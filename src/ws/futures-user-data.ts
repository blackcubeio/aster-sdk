import type { AsterClient } from '../common/config';
import type { WebSocketFactory, WebSocketLike } from '../common/config';
import type { JsonValue } from '../common/types';
import type { FuturesUserDataOptions } from '../common/ws';
import type { EventHandler, Unsubscribe } from '../common/ws';
import { resolveReadNetwork } from '../rest/client';
import {
  IDLE_TIMEOUT_MS,
  RECONNECT_BASE_MS,
  RECONNECT_CAP_MS,
  RECONNECT_FACTOR,
  RECONNECT_JITTER,
  RECONNECT_STABLE_MS,
} from './ws-constants';

/**
 * Flux user-data futures (`fstream/ws/<listenKey>`). Connexion brute liée à un `listenKey`
 * (cf. `createListenKey`) : chaque message porte un type d'événement `e`
 * (`ACCOUNT_UPDATE`, `ORDER_TRADE_UPDATE`, `listenKeyExpired`…) sur lequel on dispatche.
 *
 * Le `listenKey` est maintenu vivant côté client unifié (scheduler `keepAliveListenKey`,
 * cf. `UnifiedWsClient.ensureUserData`) : la reconnexion sur **la même URL** reste donc valide.
 * Robustesse (spec commune 4 SDK) : backoff exponentiel + jitter + cap, reset après stabilité,
 * idle-timeout, parsing défensif. Pas de re-subscribe wire (l'URL porte le listenKey).
 */
export class FuturesUserDataStream {
  public onMessage: ((event: JsonValue) => void) | null = null;
  public onError: ((error: unknown) => void) | null = null;
  public onClose: (() => void) | null = null;
  public onReconnect: (() => void) | null = null;

  private readonly url: string;
  private readonly createSocket: WebSocketFactory;
  private socket: WebSocketLike | null = null;
  private readonly handlers = new Map<string, Set<EventHandler>>();
  private shouldReconnect = false;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private lastMessageAt = 0;
  private stableTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(client: AsterClient, listenKey: string, options: FuturesUserDataOptions = {}) {
    const base = client.wsUrls.futures[resolveReadNetwork(client, options.label)];
    this.url = options.url ?? `${base}/ws/${listenKey}`;
    this.createSocket = options.webSocket ?? client.webSocket;
  }

  public connect(): Promise<void> {
    this.shouldReconnect = true;
    return new Promise((resolve, reject) => {
      const socket = this.createSocket(this.url);
      this.socket = socket;
      socket.onopen = () => {
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
    this.stopIdleTimer();
    if (this.stableTimer !== null) {
      clearTimeout(this.stableTimer);
      this.stableTimer = null;
    }
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket !== null) {
      this.socket.close();
      this.socket = null;
    }
  }

  /** Abonne un handler à un type d'événement (`e`). Renvoie une fonction de désabonnement. */
  public on(eventType: string, handler: EventHandler): Unsubscribe {
    let handlerSet = this.handlers.get(eventType);
    if (handlerSet === undefined) {
      handlerSet = new Set();
      this.handlers.set(eventType, handlerSet);
    }
    handlerSet.add(handler);
    return () => {
      handlerSet.delete(handler);
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
    const eventType = message.e;
    if (typeof eventType === 'string') {
      const handlerSet = this.handlers.get(eventType);
      if (handlerSet !== undefined) {
        for (const handler of handlerSet) {
          handler(message);
        }
      }
    }
  }

  // ── Idle-timeout (pas de ping JSON applicatif côté Aster/Binance) ──

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
    this.stopIdleTimer();
    if (this.stableTimer !== null) {
      clearTimeout(this.stableTimer);
      this.stableTimer = null;
    }
    this.socket = null;
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

  /** L'URL porte le listenKey (maintenu vivant côté client unifié) → rien à rejouer côté wire. */
  private afterReconnect(): void {
    if (this.onReconnect !== null) {
      this.onReconnect();
    }
  }
}
