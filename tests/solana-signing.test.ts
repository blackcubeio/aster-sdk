import { ed25519 } from '@noble/curves/ed25519';
import { utf8ToBytes } from '@noble/hashes/utils';
import bs58 from 'bs58';
import { describe, expect, it } from 'vitest';
import { Aster } from '../src/dex/aster';
import { readEnv } from './_env';

const SOL_PUB = readEnv('SOLANA_PUBLIC_KEY');
const SOL_PRIV = readEnv('SOLANA_PRIVATE_KEY');
const hasSol = SOL_PUB !== undefined && SOL_PRIV !== undefined;

// Helpers crypto via la façade (Aster gère EVM + Solana).
const helpers = new Aster().helpers();

describe('helpers().keyTypeOf', () => {
  it('détecte EVM (0x) vs Solana (base58)', () => {
    expect(
      helpers.keyTypeOf('0x4fd0a42218f3eae43a6ce26d22544e986139a01e5b34a62db53757ffca81bae1'),
    ).toBe('evm');
    expect(helpers.keyTypeOf('5HpHagT65TZzG1PH3CSu63k8DbpvD8s5ip4nEB3kEsreA')).toBe('solana');
  });
});

describe.skipIf(hasSol === false)('signature Solana (clé réelle .env) — via helpers()', () => {
  it('helpers().solanaAddress dérive la pubkey du SOLANA_PUBLIC_KEY', () => {
    expect(helpers.solanaAddress(SOL_PRIV as string)).toBe(SOL_PUB);
  });

  it('helpers().signEd25519 produit une signature qui vérifie contre la pubkey', () => {
    const msg = `symbol=BTCUSDT&side=BUY&nonce=1780000000000000&user=${SOL_PUB}`;
    const sigB58 = helpers.signEd25519(msg, SOL_PRIV as string);
    const ok = ed25519.verify(
      bs58.decode(sigB58),
      utf8ToBytes(msg),
      bs58.decode(SOL_PUB as string),
    );
    expect(ok).toBe(true);
  });
});
