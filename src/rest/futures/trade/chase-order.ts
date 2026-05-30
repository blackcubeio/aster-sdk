import type { AsterClient } from '../../../common/config';
import type { ChaseOrder, ChaseOrderParams } from '../../../common/futures';
import type { JsonObject } from '../../../common/types';
import { httpPostForm } from '../../client';
import { buildSignedRequest } from '../../signing';
import { assign } from './payloads';

/**
 * Place a Chase strategy order (`TRADE`): a BBO-pegged GTX limit that auto-re-pegs to the
 * top of book until it fills or the market drifts past `maxChaseOffset`.
 */
export function chaseOrder(
  client: AsterClient,
  params: ChaseOrderParams,
  label: string,
): Promise<ChaseOrder> {
  const payload: JsonObject = {
    symbol: params.symbol,
    side: params.side,
    quantityUnit: params.quantityUnit,
    quantity: params.quantity,
  };
  assign(payload, 'positionSide', params.positionSide);
  assign(payload, 'reduceOnly', params.reduceOnly);
  assign(payload, 'chaseOffset', params.chaseOffset);
  assign(payload, 'chaseOffsetType', params.chaseOffsetType);
  assign(payload, 'maxChaseOffset', params.maxChaseOffset);
  assign(payload, 'maxChaseOffsetType', params.maxChaseOffsetType);
  assign(payload, 'priceLimit', params.priceLimit);
  assign(payload, 'timeInForce', params.timeInForce);
  assign(payload, 'clientStrategyId', params.clientStrategyId);
  const { body, network } = buildSignedRequest(client, payload, label);
  return httpPostForm<ChaseOrder>(client, 'futures', '/fapi/v3/chase', body, network);
}
