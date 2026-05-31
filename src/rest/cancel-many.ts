import type { AsterClient } from '../common/config';
import type { BatchOrderResult } from '../common/futures';
import type { Order } from '../common/types';
import { OrderConverter } from '../converters/order';
import { cancelMultipleOrders } from './futures/trade/cancel-multiple-orders';

/** Entrée unifiée d'une annulation multiple : `name` + l'une des deux listes d'identifiants. */
export interface CancelManyParams {
  /** Paire/symbole (= `Pair.name`). */
  name: string;
  /** IDs d'ordre exchange à annuler (xor `clientIds`). */
  ids?: string[];
  /** Client order ids à annuler (xor `ids`). */
  clientIds?: string[];
}

/** Un `BatchOrderResult` natif est une erreur `{ code, msg }` (pas un ordre) ? */
function isError(r: BatchOrderResult): r is { code: number; msg: string } {
  return (r as { orderId?: number }).orderId === undefined;
}

/**
 * Annule un **lot** d'ordres (≤ 10) au **format unifié** (écriture signée, Aster `/batchOrders`
 * DELETE). Entrée = vocabulaire commun (`name` + `ids` **ou** `clientIds`) ; sortie = `Order[]`
 * (type commun), **1 par ordre visé**. Un ordre dont l'annulation échoue devient un `Order`
 * `status: 'rejected'`, le code/msg natif dans `xtras` — rien n'est jeté.
 */
export function cancelManyOrders(
  client: AsterClient,
  params: CancelManyParams,
  label: string,
): Promise<Order[]> {
  const converter = new OrderConverter();
  return cancelMultipleOrders(
    client,
    {
      symbol: params.name,
      orderIdList: params.ids === undefined ? undefined : params.ids.map(Number),
      origClientOrderIdList: params.clientIds,
    },
    label,
  ).then((results) =>
    results.map((res, i) => {
      if (isError(res)) {
        const id = params.ids?.[i];
        const clientId = params.clientIds?.[i];
        return {
          name: params.name,
          kind: 'perp' as const,
          id: id ?? '',
          clientId: clientId ?? null,
          side: 'buy' as const,
          type: 'other' as const,
          price: null,
          size: '0',
          filled: '0',
          status: 'rejected' as const,
          tif: null,
          reduceOnly: null,
          time: Date.now(),
          xtras: { code: res.code, msg: res.msg },
        };
      }
      return converter.toCommon(res);
    }),
  );
}
