import { httpGet } from '../../client';
import type { FundingInfo } from '../types';

/** Funding rate configuration (interval, caps) per symbol. */
export function getFundingInfo(symbol?: string, label?: string): Promise<FundingInfo[]> {
  return httpGet<FundingInfo[]>('futures', '/fapi/v3/fundingInfo', { symbol }, label);
}
