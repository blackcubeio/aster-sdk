import { httpPostForm } from '../../client';
import { buildSignedRequest } from '../../signing';
import type { CountdownCancelAllParams, CountdownCancelAllResult } from '../types';

/**
 * Arm/refresh a dead-man's switch that cancels all open orders on `symbol` after
 * `countdownTime` ms of silence (`TRADE`). Call repeatedly as a heartbeat; `0` disarms.
 */
export function countdownCancelAll(
  params: CountdownCancelAllParams,
  label: string,
): Promise<CountdownCancelAllResult> {
  const { body, network } = buildSignedRequest(
    { symbol: params.symbol, countdownTime: params.countdownTime },
    label,
  );
  return httpPostForm<CountdownCancelAllResult>(
    'futures',
    '/fapi/v3/countdownCancelAll',
    body,
    network,
  );
}
