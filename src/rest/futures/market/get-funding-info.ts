import type { FundingInfo } from '../../../common/futures';
import { httpGet } from '../../client';

/** Funding rate configuration (interval, caps) per symbol. */
export function getFundingInfo(symbol?: string, label?: string): Promise<FundingInfo[]> {
  return httpGet<FundingInfo[]>('futures', '/fapi/v3/fundingInfo', { symbol }, label);
}
