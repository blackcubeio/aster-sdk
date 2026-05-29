import { type WebSocketFactory, type WebSocketLike, getConfig } from '../common/config';
import type { JsonValue } from '../common/types';
import { resolveReadNetwork } from '../rest/client';
import type { EventHandler, Unsubscribe } from './types';

export interface SpotUserDataOptions {
  url?: string;
  webSocket?: WebSocketFactory;
  /** Label du signer : choisit le réseau (défaut mainnet). */
  label?: string;
}

/**
 * Flux user-data spot (`sstream/ws/<listenKey>`). Connexion brute liée à un `listenKey`
 * (cf. `createListenKeySpot`) ; dispatch par type d'événement `e` (`ACCOUNT_UPDATE`,
 * ordre…). Rafraîchir le `listenKey` (`keepAliveListenKeySpot`) toutes les ~60 min.
 */
export class SpotUserDataStream {
  public onMessage: ((event: JsonValue) => void) | null = null;
  public onError: ((error: unknown) => void) | null = null;
  public onClose: (() => void) | null = null;
  public onReconnect: (() => void) | null = null;

  private readonly url: string;
  private readonly createSocket: WebSocketFactory;
  private socket: WebSocketLike | null = null;
  private readonly handlers = new Map<string, Set<EventHandler>>();
  private shouldReconnect = false;

  constructor(listenKey: string, options: SpotUserDataOptions = {}) {
    const config = getConfig();
    const base = config.wsUrls.spot[resolveReadNetwork(options.label)];
    this.url = options.url ?? `${base}/ws/${listenKey}`;
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
    const message = JSON.parse(String(raw)) as JsonValue;
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
