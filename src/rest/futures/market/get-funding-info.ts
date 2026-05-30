import type { AsterClient } from '../../../common/config';
import type { FundingInfo } from '../../../common/futures';
import { httpGet } from '../../client';

/** Funding rate configuration (interval, caps) per symbol. */
export function getFundingInfo(
  client: AsterClient,
  symbol?: string,
  label?: string,
): Promise<FundingInfo[]> {
  return httpGet<FundingInfo[]>(client, 'futures', '/fapi/v3/fundingInfo', { symbol }, label);
}
