import type { AsterClient } from '../../../common/config';
import type { CountdownCancelAllParams, CountdownCancelAllResult } from '../../../common/futures';
import { httpPostForm } from '../../client';
import { buildSignedRequest } from '../../signing';

/**
 * Arm/refresh a dead-man's switch that cancels all open orders on `symbol` after
 * `countdownTime` ms of silence (`TRADE`). Call repeatedly as a heartbeat; `0` disarms.
 */
export function countdownCancelAll(
  client: AsterClient,
  params: CountdownCancelAllParams,
  label: string,
): Promise<CountdownCancelAllResult> {
  const { body, network } = buildSignedRequest(
    client,
    { symbol: params.symbol, countdownTime: params.countdownTime },
    label,
  );
  return httpPostForm<CountdownCancelAllResult>(
    client,
    'futures',
    '/fapi/v3/countdownCancelAll',
    body,
    network,
  );
}
