import type { AsterClient } from '../../../common/config';
import type {
  PlaceStrategyOrderParams,
  PlaceStrategyOrderResult,
  StrategyHistoryQuery,
  StrategyOrder,
  StrategyOrderQuery,
  UpdateStrategyOrderParams,
  UpdateStrategyOrderResult,
} from '../../../common/futures';
import type { JsonObject, JsonValue } from '../../../common/types';
import { httpGetSigned, httpPostForm } from '../../client';
import { buildSignedRequest } from '../../signing';

/** Place an OTO / OCO / OTOCO strategy order (`TRADE`). */
export function placeStrategyOrder(
  client: AsterClient,
  params: PlaceStrategyOrderParams,
  label: string,
): Promise<PlaceStrategyOrderResult> {
  const payload: JsonObject = {
    strategyType: params.strategyType,
    // Frontière de sérialisation : `StrategySubOrder` est une interface structurée (sans index
    // signature) → cast `unknown` strictement nécessaire pour l'injecter dans le payload JSON.
    subOrderList: params.subOrderList as unknown as JsonValue,
  };
  if (params.clientStrategyId !== undefined) {
    payload.clientStrategyId = params.clientStrategyId;
  }
  const { body, network } = buildSignedRequest(client, payload, label);
  return httpPostForm<PlaceStrategyOrderResult>(
    client,
    'futures',
    '/fapi/v3/placeStrategyOrder',
    body,
    network,
  );
}

/** Update sub-orders of an existing strategy order (`TRADE`). */
export function updateStrategyOrder(
  client: AsterClient,
  params: UpdateStrategyOrderParams,
  label: string,
): Promise<UpdateStrategyOrderResult[]> {
  const { body, network } = buildSignedRequest(
    client,
    {
      strategyId: params.strategyId,
      strategyType: params.strategyType,
      // Frontière de sérialisation (cf. placeStrategyOrder) : interface structurée → JSON payload.
      subOrderList: params.subOrderList as unknown as JsonValue,
    },
    label,
  );
  return httpPostForm<UpdateStrategyOrderResult[]>(
    client,
    'futures',
    '/fapi/v3/updateStrategyOrder',
    body,
    network,
  );
}

/** Query a current open strategy order (`USER_DATA`). `strategyId` xor `clientStrategyId`. */
export function getStrategyOpenOrder(
  client: AsterClient,
  query: StrategyOrderQuery,
  label: string,
): Promise<StrategyOrder> {
  const { body, network } = buildSignedRequest(client, { ...query }, label);
  return httpGetSigned<StrategyOrder>(
    client,
    'futures',
    '/fapi/v3/strategyOpenOrder',
    body,
    network,
  );
}

/** Query a historical strategy order (`USER_DATA`, lookback ≤ 90 j). */
export function getStrategyHistoryOrder(
  client: AsterClient,
  query: StrategyHistoryQuery,
  label: string,
): Promise<StrategyOrder> {
  const { body, network } = buildSignedRequest(client, { ...query }, label);
  return httpGetSigned<StrategyOrder>(
    client,
    'futures',
    '/fapi/v3/strategyHistoryOrder',
    body,
    network,
  );
}
