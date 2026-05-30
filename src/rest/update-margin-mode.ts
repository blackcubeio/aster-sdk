import type { AsterClient } from '../common/config';
import { MarginType } from '../common/futures';
import type { UpdateMarginModeParams } from '../common/types';
import type { MarketKind } from '../common/types';
import { httpPostForm } from './client';
import { buildSignedRequest } from './signing';

/** Bascule une paire entre marge isolée et cross (**écriture signée**, Aster `/fapi/v3/marginType`). */
export function updateMarginMode(
  client: AsterClient,
  params: UpdateMarginModeParams,
  label: string,
): Promise<void> {
  const { body, network } = buildSignedRequest(
    client,
    { symbol: params.name, marginType: params.isolated ? MarginType.Isolated : MarginType.Crossed },
    label,
  );
  return httpPostForm(client, 'futures', '/fapi/v3/marginType', body, network).then(
    () => undefined,
  );
}
