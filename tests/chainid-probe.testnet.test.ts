import { secp256k1 } from '@noble/curves/secp256k1';
import { keccak_256 } from '@noble/hashes/sha3';
import { bytesToHex } from '@noble/hashes/utils';
import { describe, expect, it } from 'vitest';
import { SIGNATURE_CHAIN_ID } from '../src/common/constants';
import type { Hex } from '../src/common/types';
import { Aster } from '../src/dex/aster';
import { readEnv } from './_env';

// SONDE de validation empirique du `SIGNATURE_CHAIN_ID` account-management (56 vs 1666). Signe une
// vraie `ApproveAgent` sur **testnet Aster** (autorisé par Philippe pour Aster) et lit le code
// serveur. Aster = fork de l'API Binance : `-1022` = « Signature not valid » → chainId faux. Tout
// autre code (succès, ou erreur métier) → la signature a été ACCEPTÉE, donc le chainId est bon.
const MAIN_KEY = readEnv('EVM_PRIVATE_KEY') as Hex | undefined;
const USER = readEnv('EVM_PUBLIC_KEY') as Hex | undefined;
const ready = MAIN_KEY !== undefined && USER !== undefined;

describe.skipIf(!ready)('Aster — sonde SIGNATURE_CHAIN_ID (testnet réel)', () => {
  it(`ApproveAgent signée avec chainId=${SIGNATURE_CHAIN_ID} : acceptée ?`, async () => {
    const dex = new Aster(
      {
        main: {
          privateKey: MAIN_KEY as Hex,
          mainPrivateKey: MAIN_KEY as Hex,
          user: USER as Hex,
          network: 'testnet',
        },
      },
      { default: 'main' },
    );

    // Adresse d'agent EVM jetable (la validation porte sur la signature, pas sur l'agent).
    const priv = secp256k1.utils.randomPrivateKey();
    const pub = secp256k1.getPublicKey(priv, false); // non compressée (65 octets)
    const agentAddress = `0x${bytesToHex(keccak_256(pub.slice(1)).slice(-20))}`;

    let code: number | undefined;
    let msg: string | undefined;
    try {
      const res = await dex.native.agents().approve({
        agentName: `chainid-probe-${SIGNATURE_CHAIN_ID}`,
        agentAddress,
        expired: Date.now() + 30 * 24 * 3600 * 1000,
        canSpotTrade: false,
        canPerpTrade: true,
        canWithdraw: false,
      });
      code = res.code;
      msg = res.msg;
    } catch (e) {
      // httpPostForm peut throw sur HTTP non-2xx en embarquant le corps {code,msg}.
      const m = e instanceof Error ? e.message : String(e);
      msg = m;
      const found = m.match(/-?\d{3,4}/);
      if (found !== null) code = Number(found[0]);
    }
    console.log(`[chainId=${SIGNATURE_CHAIN_ID}] code=${code ?? '∅'} msg=${msg}`);

    // -1022 = signature invalide (Aster/Binance). On VEUT prouver que ce n'est PAS -1022.
    expect(code).not.toBe(-1022);
  }, 30_000);
});
