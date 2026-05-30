import type { AsterClient } from '../../../common/config';
import type { LeverageBracket } from '../../../common/futures';
import { httpGetSigned } from '../../client';
import { buildSignedRequest } from '../../signing';

/** Notional & leverage brackets: one object for a given symbol, an array otherwise (`USER_DATA`). */
export function getLeverageBracket(
  client: AsterClient,
  symbol: string,
  label: string,
): Promise<LeverageBracket>;
export function getLeverageBracket(
  client: AsterClient,
  symbol: undefined,
  label: string,
): Promise<LeverageBracket[]>;
export function getLeverageBracket(
  client: AsterClient,
  symbol: string | undefined,
  label: string,
): Promise<LeverageBracket | LeverageBracket[]> {
  const { body, network } = buildSignedRequest(client, { symbol }, label);
  return httpGetSigned<LeverageBracket | LeverageBracket[]>(
    client,
    'futures',
    '/fapi/v3/leverageBracket',
    body,
    network,
  );
}
