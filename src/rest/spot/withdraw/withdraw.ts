import { ZERO_ADDRESS } from '../../../common/constants';
import type { Hex } from '../../../common/types';
import { microsecondNonce, serializeParams } from '../../../common/utils';
import { httpGet, httpPostForm } from '../../client';
import { assertEvmSigner, resolveMainSigner, signEip712 } from '../../signing';
import type { WithdrawFee, WithdrawFeeQuery, WithdrawParams, WithdrawResult } from '../types';

const CHAIN_NAMES: Record<string, string> = { '1': 'ETH', '56': 'BSC', '42161': 'Arbitrum' };

const WITHDRAW_TYPES = {
  Action: [
    { name: 'type', type: 'string' },
    { name: 'destination', type: 'address' },
    { name: 'destination Chain', type: 'string' },
    { name: 'token', type: 'string' },
    { name: 'amount', type: 'string' },
    { name: 'fee', type: 'string' },
    { name: 'nonce', type: 'uint256' },
    { name: 'aster chain', type: 'string' },
  ],
};

/** Estimate the withdrawal fee for a chain/asset (no auth). */
export function getWithdrawFeeSpot(query: WithdrawFeeQuery, label?: string): Promise<WithdrawFee> {
  return httpGet<WithdrawFee>(
    'spot',
    '/api/v3/aster/withdraw/estimateFee',
    { chainId: query.chainId, asset: query.asset },
    label,
  );
}

/**
 * Withdraw an asset on-chain (`USER_DATA`) — **grosse opération** signée par le compte
 * principal (`mainPrivateKey`) via l'EIP-712 domaine `Aster` / type `Action` (chainId 56).
 * `receiver` doit être le compte courant (défaut : `user`).
 */
export function withdrawSpot(params: WithdrawParams, label: string): Promise<WithdrawResult> {
  assertEvmSigner(label, 'withdrawSpot');
  const resolved = resolveMainSigner(label);
  const receiver = params.receiver ?? resolved.user;
  const destinationChain = params.destinationChain ?? CHAIN_NAMES[params.chainId] ?? params.chainId;
  const asterChain = resolved.network === 'mainnet' ? 'Mainnet' : 'Testnet';
  const nonce = Number(microsecondNonce());

  const userSignature = signEip712(
    { name: 'Aster', version: '1', chainId: 56, verifyingContract: ZERO_ADDRESS },
    WITHDRAW_TYPES,
    'Action',
    {
      type: 'Withdraw',
      destination: receiver,
      'destination Chain': destinationChain,
      token: params.asset,
      amount: params.amount,
      fee: params.fee,
      nonce,
      'aster chain': asterChain,
    },
    resolved.mainPrivateKey as Hex,
  );

  const body = serializeParams({
    chainId: params.chainId,
    asset: params.asset,
    amount: params.amount,
    fee: params.fee,
    receiver,
    nonce,
    userSignature,
  });
  return httpPostForm<WithdrawResult>(
    'spot',
    '/api/v3/aster/user-withdraw',
    body,
    resolved.network,
  );
}
