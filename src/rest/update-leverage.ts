import type { LeverageUpdate, UpdateLeverageParams } from '../common/types';
import type { MarketKind } from '../common/types';
import { httpPostForm } from './client';
import { buildSignedRequest } from './signing';

interface LeverageResultWire {
  symbol: string;
  leverage: number;
  maxNotionalValue: string;
}

/** Change le levier initial d'une paire (**écriture signée**, Aster `/fapi/v3/leverage`). */
export function updateLeverage(
  params: UpdateLeverageParams,
  label: string,
): Promise<LeverageUpdate> {
  const { body, network } = buildSignedRequest(
    { symbol: params.name, leverage: params.leverage },
    label,
  );
  return httpPostForm<LeverageResultWire>('futures', '/fapi/v3/leverage', body, network).then(
    (res) => ({
      name: res.symbol,
      leverage: res.leverage,
      xtras: { maxNotionalValue: res.maxNotionalValue },
    }),
  );
}
