import type { MarketKind } from '../common/types';
import { httpPostForm } from './client';
import { buildSignedRequest } from './signing';

/** Paramètres unifiés (mêmes champs sur les 3 SDK). */
export interface CancelAllOrdersParams {
  /** Paire/symbole (= `Pair.name`). */
  name: string;
  /** Type de marché ; défaut `perp`. */
  kind?: MarketKind;
}

/** Résultat unifié d'une annulation globale. */
export interface CancelAllResult {
  /** Nombre d'ordres annulés ; `null` si l'exchange ne le fournit pas (Aster). */
  cancelled: number | null;
}

/** Annule tous les ordres ouverts d'une paire (**écriture signée**, Aster `/fapi/v3/allOpenOrders`). */
export function cancelAllOrders(
  params: CancelAllOrdersParams,
  label: string,
): Promise<CancelAllResult> {
  const { body, network } = buildSignedRequest({ symbol: params.name }, label);
  return httpPostForm('futures', '/fapi/v3/allOpenOrders', body, network, 'DELETE').then(() => ({
    cancelled: null,
  }));
}
