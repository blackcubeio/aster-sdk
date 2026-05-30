import type { WebSocketFactory } from './config';
import type { JsonValue } from './types';

/** Annule un abonnement WebSocket. */
export type Unsubscribe = () => void;

/** Handler d'un flux de marché : reçoit le payload brut. */
export type StreamHandler = (data: JsonValue) => void;

/** Handler d'un événement user-data : reçoit l'événement brut (avec son champ `e`). */
export type EventHandler = (event: JsonValue) => void;

// ── depuis ws/spot-client.ts ──
/** Niveaux d'un flux de profondeur partielle spot. */
export type SpotDepthLevels = 5 | 10 | 20;

export interface SpotWsOptions {
  url?: string;
  webSocket?: WebSocketFactory;
  /** Label du signer : choisit le réseau (défaut mainnet). */
  label?: string;
}

// ── depuis ws/futures-client.ts ──
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

// ── depuis ws/spot-user-data.ts ──
export interface SpotUserDataOptions {
  url?: string;
  webSocket?: WebSocketFactory;
  /** Label du signer : choisit le réseau (défaut mainnet). */
  label?: string;
}

// ── depuis ws/futures-user-data.ts ──
export interface FuturesUserDataOptions {
  url?: string;
  webSocket?: WebSocketFactory;
  /** Label du signer : choisit le réseau (défaut mainnet). */
  label?: string;
}

// ── depuis ws/unified-client.ts ──
export interface UnifiedWsOptions {
  /** Label du signer : choisit le réseau (défaut mainnet). */
  label?: string;
  webSocket?: WebSocketFactory;
}
