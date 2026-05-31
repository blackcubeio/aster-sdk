import type { JsonValue } from './types';

let lastMicros = 0n;

/**
 * Nonce V3 : timestamp courant en **microsecondes**, strictement croissant. La base est
 * `Date.now()` (précision ms) convertie en µs ; un compteur départage les appels d'une
 * même milliseconde pour garantir l'unicité. Renvoyé en `string` (format attendu sur le
 * fil). Doit rester à moins de 10 s du temps serveur.
 */
export function microsecondNonce(): string {
  const micros = BigInt(Date.now()) * 1000n;
  lastMicros = micros > lastMicros ? micros : lastMicros + 1n;
  return lastMicros.toString();
}

/**
 * Réplique `urllib.parse.urlencode` (quote_plus) de Python : caractères non réservés
 * `A-Za-z0-9_.-~` conservés, espace → `+`, le reste percent-encodé. Aster signe **la
 * chaîne exacte** transmise sur le fil ; clé et valeur sont donc encodées de façon
 * identique des deux côtés (signature et requête) pour que le serveur reconstruise le
 * même `msg`.
 */
export function encodeFormComponent(value: string): string {
  return encodeURIComponent(value)
    .replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`)
    .replace(/%20/g, '+');
}

/**
 * Sérialise un jeu de paramètres en `key=value&…` dans l'ordre d'insertion (jamais
 * trié : l'ordre fait partie du message signé). Les `undefined` sont omis ; les
 * booléens et nombres sont stringifiés ; les objets/tableaux sont encodés en JSON.
 */
export function serializeParams(params: Record<string, JsonValue | undefined>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) {
      continue;
    }
    parts.push(`${encodeFormComponent(key)}=${encodeFormComponent(stringifyParam(value))}`);
  }
  return parts.join('&');
}

function stringifyParam(value: JsonValue): string {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'boolean' || typeof value === 'number') {
    return String(value);
  }
  return JSON.stringify(value);
}

/** Convertit un datetime unifié `YYYY-MM-DD HH:MM:SS` (UTC, C7) en millisecondes epoch. */
export function dateToMs(date: string): number {
  return new Date(`${date.replace(' ', 'T')}Z`).getTime();
}
