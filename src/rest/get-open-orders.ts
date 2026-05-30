import type { MarketKind, Order } from '../common/types';
import { httpGetSigned } from './client';
import { OrderConverter, type OrderNative } from '../converters/order';
import { buildSignedRequest } from './signing';

/** Paramètres unifiés. `user` ignoré côté Aster (compte = signataire de `label`). */
export interface GetOpenOrdersParams {
  /** Adresse du compte (HL/Pacifica) ; Aster utilise le signataire de `label`. */
  user?: string;
  /** Type de marché ; défaut `perp`. */
  kind?: MarketKind;
  /** Filtre optionnel sur une paire. */
  name?: string;
}

/**
 * Ordres ouverts au **format unifié** `Order` (Aster futures `/fapi/v3/openOrders`, **signé**).
 * Le routage spot sera ajouté ensuite (shape `SpotOrder` distincte).
 */
export function getOpenOrders(params: GetOpenOrdersParams, label: string): Promise<Order[]> {
  const converter = new OrderConverter();
  const { body, network } = buildSignedRequest({ symbol: params.name }, label);
  return httpGetSigned<OrderNative[]>('futures', '/fapi/v3/openOrders', body, network).then(
    (wire) => wire.map((entry) => converter.toCommon(entry)),
  );
}
