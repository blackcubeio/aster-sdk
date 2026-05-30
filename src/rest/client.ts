import type { AsterClient } from '../common/config';
import type { QueryParams, QueryValue } from '../common/types';
import type { Network, Product } from '../common/types';

/**
 * Réseau d'une **lecture**. Le label est optionnel : sans label on retombe sur le
 * **mainnet** (les lectures ne touchent pas au wallet), avec un label on tape sur le
 * réseau de son signer.
 */
export function resolveReadNetwork(client: AsterClient, label?: string): Network {
  if (label === undefined) {
    return 'mainnet';
  }
  const signer = client.signers[label];
  if (signer === undefined) {
    throw new Error(`Aucun signer enregistré sous "${label}"; ajoute-le dans init({ signers })`);
  }
  return signer.network;
}

export class AsterApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: number | null,
    message: string,
  ) {
    super(message);
    this.name = 'AsterApiError';
  }
}

export function buildUrl(baseUrl: string, path: string, query?: QueryParams): string {
  const url = new URL(baseUrl + path);
  if (query !== undefined) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

/** Lecture publique (non signée). `label` optionnel choisit le réseau (défaut mainnet). */
export function httpGet<TData>(
  client: AsterClient,
  product: Product,
  path: string,
  query?: QueryParams,
  label?: string,
): Promise<TData> {
  const base = client.restUrls[product][resolveReadNetwork(client, label)];
  return client
    .fetch(buildUrl(base, path, query), { method: 'GET', headers: { Accept: 'application/json' } })
    .then((response) => parseResponse<TData>(response));
}

/**
 * Écriture signée : le corps `application/x-www-form-urlencoded` est déjà sérialisé et
 * signé (cf. `buildSignedRequest`). Il est transmis **verbatim** pour que le serveur
 * reconstruise le même `msg`. `network` provient du signer résolu en amont.
 */
export function httpPostForm<TData>(
  client: AsterClient,
  product: Product,
  path: string,
  body: string,
  network: Network,
  method: 'POST' | 'DELETE' | 'PUT' = 'POST',
): Promise<TData> {
  const base = client.restUrls[product][network];
  return client
    .fetch(base + path, {
      method,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body,
    })
    .then((response) => parseResponse<TData>(response));
}

/**
 * Lecture signée (`USER_DATA`) : la chaîne `body` déjà sérialisée et signée (cf.
 * `buildSignedRequest`) est transmise **verbatim** en query string, signature incluse.
 */
export function httpGetSigned<TData>(
  client: AsterClient,
  product: Product,
  path: string,
  body: string,
  network: Network,
): Promise<TData> {
  const base = client.restUrls[product][network];
  return client
    .fetch(`${base}${path}?${body}`, { method: 'GET', headers: { Accept: 'application/json' } })
    .then((response) => parseResponse<TData>(response));
}

function parseResponse<TData>(response: Response): Promise<TData> {
  return response.text().then((body) => {
    const parsed = tryParseJson(body);
    if (response.ok === false) {
      const error = parsed as { code?: number; msg?: string; error?: string } | null;
      const message =
        error?.msg ?? error?.error ?? (body === '' ? `HTTP ${response.status}` : body);
      throw new AsterApiError(response.status, error?.code ?? null, message);
    }
    if (parsed === null) {
      throw new AsterApiError(response.status, null, body === '' ? 'Empty response' : body);
    }
    return parsed as TData;
  });
}

function tryParseJson(body: string): unknown {
  if (body === '') {
    return null;
  }
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}
