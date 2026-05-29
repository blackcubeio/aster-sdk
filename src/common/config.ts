import {
  FUTURES_REST_URL,
  FUTURES_WS_URL,
  SPOT_REST_URL,
  SPOT_WS_URL,
  TESTNET_FUTURES_REST_URL,
  TESTNET_FUTURES_WS_URL,
  TESTNET_SPOT_REST_URL,
  TESTNET_SPOT_WS_URL,
} from './constants';
import type { Network, Product, Signer } from './types';

export type { Network, Product };

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export interface WebSocketLike {
  readyState: number;
  send(data: string): void;
  close(): void;
  onopen: ((event: unknown) => void) | null;
  onmessage: ((event: { data: unknown }) => void) | null;
  onclose: ((event: unknown) => void) | null;
  onerror: ((event: unknown) => void) | null;
}

export type WebSocketFactory = (url: string) => WebSocketLike;

/** URLs d'un endpoint donné, par réseau. */
export type NetworkUrls = Record<Network, string>;
/** URLs par produit puis par réseau. */
export type ProductUrls = Record<Product, NetworkUrls>;

export interface InitOptions {
  fetch?: FetchLike;
  webSocket?: WebSocketFactory;
  /** Registre de signers indexés par label. Chaque signer porte son propre réseau. */
  signers?: Record<string, Signer>;
  /** Override des URLs REST par produit / réseau. */
  restUrls?: Partial<Record<Product, Partial<NetworkUrls>>>;
  /** Override des URLs WebSocket par produit / réseau. */
  wsUrls?: Partial<Record<Product, Partial<NetworkUrls>>>;
}

export interface AsterConfig {
  fetch: FetchLike;
  webSocket: WebSocketFactory;
  signers: Record<string, Signer>;
  restUrls: ProductUrls;
  wsUrls: ProductUrls;
}

let config: AsterConfig | null = null;

export function init(options: InitOptions = {}): void {
  const fetchImpl =
    options.fetch ??
    (typeof globalThis.fetch === 'function' ? globalThis.fetch.bind(globalThis) : undefined);
  if (fetchImpl === undefined) {
    throw new Error('No fetch implementation available; pass options.fetch to init()');
  }
  const webSocket = options.webSocket ?? defaultWebSocketFactory();
  if (webSocket === undefined) {
    throw new Error('No WebSocket implementation available; pass options.webSocket to init()');
  }
  config = {
    fetch: fetchImpl,
    webSocket,
    signers: options.signers ?? {},
    restUrls: {
      futures: {
        mainnet: options.restUrls?.futures?.mainnet ?? FUTURES_REST_URL,
        testnet: options.restUrls?.futures?.testnet ?? TESTNET_FUTURES_REST_URL,
      },
      spot: {
        mainnet: options.restUrls?.spot?.mainnet ?? SPOT_REST_URL,
        testnet: options.restUrls?.spot?.testnet ?? TESTNET_SPOT_REST_URL,
      },
    },
    wsUrls: {
      futures: {
        mainnet: options.wsUrls?.futures?.mainnet ?? FUTURES_WS_URL,
        testnet: options.wsUrls?.futures?.testnet ?? TESTNET_FUTURES_WS_URL,
      },
      spot: {
        mainnet: options.wsUrls?.spot?.mainnet ?? SPOT_WS_URL,
        testnet: options.wsUrls?.spot?.testnet ?? TESTNET_SPOT_WS_URL,
      },
    },
  };
}

function defaultWebSocketFactory(): WebSocketFactory | undefined {
  if (typeof globalThis.WebSocket !== 'function') {
    return undefined;
  }
  return (url) => new globalThis.WebSocket(url) as unknown as WebSocketLike;
}

export function getConfig(): AsterConfig {
  if (config === null) {
    throw new Error('Aster SDK not initialized; call init() first');
  }
  return config;
}

export function resetConfig(): void {
  config = null;
}
