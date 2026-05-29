import type { Order } from '../common/types';
import { httpGetSigned } from './client';
import { OrderConverter, type OrderNative } from './converters/order';
import { buildSignedRequest } from './signing';

/** Paramètres unifiés. `user` ignoré côté Aster (compte = signataire de `label`). */
export interface GetOrderHistoryParams {
  /** Adresse du compte (HL/Pacifica) ; Aster utilise le signataire de `label`. */
  user?: string;
  /** Filtre sur une paire (requis côté Aster). */
  name?: string;
  /** Début (ms). */
  startTime?: number;
  /** Fin (ms). */
  endTime?: number;
  /** Nombre max. */
  limit?: number;
}

/**
 * Historique d'ordres (actifs/annulés/exécutés) au **format unifié** `Order`
 * (Aster `/fapi/v3/allOrders`, **signé**). Le statut vient du natif (pas forcé à `open`).
 */
export function getOrderHistory(params: GetOrderHistoryParams, label: string): Promise<Order[]> {
  const converter = new OrderConverter();
  const { body, network } = buildSignedRequest(
    {
      symbol: params.name,
      startTime: params.startTime,
      endTime: params.endTime,
      limit: params.limit,
    },
    label,
  );
  return httpGetSigned<OrderNative[]>('futures', '/fapi/v3/allOrders', body, network).then((wire) =>
    wire.map((entry) => converter.toCommon(entry)),
  );
}
