/**
 * Constantes de robustesse WebSocket — **spec commune aux 4 SDK Blackcube** (Aster, Hyperliquid,
 * Pacifica, Lighter). Mêmes noms, mêmes valeurs, mêmes formules d'un SDK à l'autre.
 *
 * Aster : pas de ping JSON applicatif (le serveur Aster/Binance pousse des ping-frames
 * protocolaires) → `HEARTBEAT_INTERVAL_MS` non utilisé ici, la protection repose sur
 * l'idle-timeout (45 s) et le backoff de reconnexion.
 */

/** Délai de base avant la 1ʳᵉ tentative de reconnexion (ms). */
export const RECONNECT_BASE_MS = 500;
/** Facteur de croissance exponentielle du backoff. */
export const RECONNECT_FACTOR = 2;
/** Plafond du délai de reconnexion (ms). */
export const RECONNECT_CAP_MS = 30_000;
/** Amplitude relative du jitter aléatoire (±20 %). */
export const RECONNECT_JITTER = 0.2;
/** Durée de connexion ininterrompue au-delà de laquelle le compteur de backoff est remis à 0 (ms). */
export const RECONNECT_STABLE_MS = 10_000;
/** Aucun message reçu depuis cette durée → la socket est considérée morte, reconnexion forcée (ms). */
export const IDLE_TIMEOUT_MS = 45_000;
