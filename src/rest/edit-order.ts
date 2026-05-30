import type { MarketKind } from '../common/types';
import { httpPostForm } from './client';
import { buildOrderRef } from './futures/trade/payloads';
import type { FuturesOrder } from './futures/types';
import { buildSignedRequest } from './signing';

/** Paramètres unifiés (mêmes champs sur les 3 SDK). */
export interface EditOrderParams {
  /** Paire/symbole (= `Pair.name`). */
  name: string;
  /** Nouvelle quantité. */
  size: string;
  /** Nouveau prix. */
  price: string;
  /** ID d'ordre exchange (l'un de `id`/`clientId` requis). */
  id?: string;
  /** Client order id. */
  clientId?: string;
  /** Type de marché ; défaut `perp`. */
  kind?: MarketKind;
}

/** Résultat unifié d'une modification d'ordre (référence du nouvel ordre). */
export interface EditOrderResult {
  /** Paire/symbole. */
  name: string;
  /** ID du nouvel ordre. */
  id: string;
  /** Détails natifs hors cœur (rien jeté), omis si vide. */
  xtras?: Record<string, unknown>;
}

/** Modifie le prix/quantité d'un ordre actif (**écriture signée**, Aster `/fapi/v3/order` PUT). */
export function editOrder(params: EditOrderParams, label: string): Promise<EditOrderResult> {
  const payload = buildOrderRef(
    params.name,
    params.id === undefined ? undefined : Number(params.id),
    params.clientId,
  );
  payload.quantity = params.size;
  payload.price = params.price;
  const { body, network } = buildSignedRequest(payload, label);
  return httpPostForm<FuturesOrder>('futures', '/fapi/v3/order', body, network, 'PUT').then(
    (order) => ({
      name: params.name,
      id: String(order.orderId),
      xtras: order as unknown as Record<string, unknown>,
    }),
  );
}
