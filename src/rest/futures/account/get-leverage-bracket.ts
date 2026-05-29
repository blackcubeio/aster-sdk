import { httpGetSigned } from '../../client';
import { buildSignedRequest } from '../../signing';
import type { LeverageBracket } from '../types';

/** Notional & leverage brackets: one object for a given symbol, an array otherwise (`USER_DATA`). */
export function getLeverageBracket(symbol: string, label: string): Promise<LeverageBracket>;
export function getLeverageBracket(symbol: undefined, label: string): Promise<LeverageBracket[]>;
export function getLeverageBracket(
  symbol: string | undefined,
  label: string,
): Promise<LeverageBracket | LeverageBracket[]> {
  const { body, network } = buildSignedRequest({ symbol }, label);
  return httpGetSigned<LeverageBracket | LeverageBracket[]>(
    'futures',
    '/fapi/v3/leverageBracket',
    body,
    network,
  );
}
