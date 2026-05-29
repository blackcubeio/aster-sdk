import { beforeEach, describe, expect, it } from 'vitest';
import { init, resetConfig } from '../src/common/config';
import type { Hex } from '../src/common/types';
import { registerAndApproveAgent } from '../src/rest/futures/agent/register-and-approve-agent';
import { createSubAccount } from '../src/rest/futures/subaccount/create-sub-account';

const MAIN_KEY: Hex = '0x4fd0a42218f3eae43a6ce26d22544e986139a01e5b34a62db53757ffca81bae1';
const CHILD_KEY: Hex = '0x822e9959e022b78423eb653a62ea0020cd283e71a2a8133a6ff2aeffaf373cff';
const USER = '0x21cF8Ae13Bb72632562c6Fff438652Ba1a151bb0';
const AGENT = '0x000000000000000000000000000000000000A6E7';

let lastBody = '';

describe('account management (main-wallet signed, fetch mocké)', () => {
  beforeEach(() => {
    resetConfig();
    init({
      fetch: (_url, request) => {
        lastBody = String(request?.body ?? '');
        return Promise.resolve(
          new Response(JSON.stringify({ code: 200, msg: 'success' }), { status: 200 }),
        );
      },
      signers: {
        trader: {
          privateKey: CHILD_KEY,
          user: USER as Hex,
          signer: AGENT as Hex,
          mainPrivateKey: MAIN_KEY,
          network: 'mainnet',
        },
      },
    });
  });

  it('registerAndApproveAgent respecte l’ordre du msg et la signature', async () => {
    await registerAndApproveAgent(
      {
        agentName: 'bot',
        agentAddress: AGENT,
        expired: 1967945395040,
        canSpotTrade: true,
        canPerpTrade: false,
        canWithdraw: false,
      },
      'trader',
    );
    expect(lastBody).toMatch(
      new RegExp(
        `^user=${USER}&nonce=\\d+&agentName=bot&agentAddress=${AGENT}&expired=1967945395040&signatureChainId=56&canSpotTrade=true&canPerpTrade=false&canWithdraw=false&ipWhitelist=&signature=0x[0-9a-f]{130}$`,
      ),
    );
  });

  it('createSubAccount produit childSignature puis signature (double signature)', async () => {
    await createSubAccount(
      { subSourceAddr: AGENT, subAccountName: 'desk', childPrivateKey: CHILD_KEY },
      'trader',
    );
    expect(lastBody).toMatch(
      new RegExp(
        `^subAccountName=desk&subSourceAddr=${AGENT}&nonce=\\d+&user=${USER}&signer=${AGENT}&childSignature=0x[0-9a-f]{130}&signature=0x[0-9a-f]{130}$`,
      ),
    );
  });
});
