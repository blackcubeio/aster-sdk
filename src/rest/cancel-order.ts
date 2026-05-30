import type { MarketKind } from '../common/types';
import { httpPostForm } from './client';
import { buildOrderRef } from './futures/trade/payloads';
import { buildSignedRequest } from './signing';

/** Paramètres unifiés (mêmes champs sur les 3 SDK). */
export interface CancelOrderParams {
  /** Paire/symbole (= `Pair.name`). */
  name: string;
  /** ID d'ordre exchange (l'un de `id`/`clientId` requis). */
  id?: string;
  /** Client order id. */
  clientId?: string;
  /** Type de marché ; défaut `perp`. */
  kind?: MarketKind;
}

/** Annule un ordre actif (**écriture signée**, Aster futures `/fapi/v3/order` DELETE). */
export function cancelOrder(params: CancelOrderParams, label: string): Promise<void> {
  const payload = buildOrderRef(
    params.name,
    params.id === undefined ? undefined : Number(params.id),
    params.clientId,
  );
  const { body, network } = buildSignedRequest(payload, label);
  return httpPostForm('futures', '/fapi/v3/order', body, network, 'DELETE').then(() => undefined);
}
