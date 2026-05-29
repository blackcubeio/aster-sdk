import type { JsonValue } from '../common/types';

/** Annule un abonnement WebSocket. */
export type Unsubscribe = () => void;

/** Handler d'un flux de marché : reçoit le payload brut. */
export type StreamHandler = (data: JsonValue) => void;

/** Handler d'un événement user-data : reçoit l'événement brut (avec son champ `e`). */
export type EventHandler = (event: JsonValue) => void;
