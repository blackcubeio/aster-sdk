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
  params: PlaceStrategyOrderParams,
  label: string,
): Promise<PlaceStrategyOrderResult> {
  const payload: JsonObject = {
    strategyType: params.strategyType,
    subOrderList: params.subOrderList as unknown as JsonValue,
  };
  if (params.clientStrategyId !== undefined) {
    payload.clientStrategyId = params.clientStrategyId;
  }
  const { body, network } = buildSignedRequest(payload, label);
  return httpPostForm<PlaceStrategyOrderResult>(
    'futures',
    '/fapi/v3/placeStrategyOrder',
    body,
    network,
  );
}

/** Update sub-orders of an existing strategy order (`TRADE`). */
export function updateStrategyOrder(
  params: UpdateStrategyOrderParams,
  label: string,
): Promise<UpdateStrategyOrderResult[]> {
  const { body, network } = buildSignedRequest(
    {
      strategyId: params.strategyId,
      strategyType: params.strategyType,
      subOrderList: params.subOrderList as unknown as JsonValue,
    },
    label,
  );
  return httpPostForm<UpdateStrategyOrderResult[]>(
    'futures',
    '/fapi/v3/updateStrategyOrder',
    body,
    network,
  );
}

/** Query a current open strategy order (`USER_DATA`). `strategyId` xor `clientStrategyId`. */
export function getStrategyOpenOrder(
  query: StrategyOrderQuery,
  label: string,
): Promise<StrategyOrder> {
  const { body, network } = buildSignedRequest({ ...query }, label);
  return httpGetSigned<StrategyOrder>('futures', '/fapi/v3/strategyOpenOrder', body, network);
}

/** Query a historical strategy order (`USER_DATA`, lookback ≤ 90 j). */
export function getStrategyHistoryOrder(
  query: StrategyHistoryQuery,
  label: string,
): Promise<StrategyOrder> {
  const { body, network } = buildSignedRequest({ ...query }, label);
  return httpGetSigned<StrategyOrder>('futures', '/fapi/v3/strategyHistoryOrder', body, network);
}
