import { secp256k1 } from '@noble/curves/secp256k1';
import { hexToBytes } from '@noble/hashes/utils';
import { describe, expect, it } from 'vitest';
import { AGENT_CHAIN_ID } from '../src/common/constants';
import type { Hex } from '../src/common/types';
import { microsecondNonce, serializeParams } from '../src/common/utils';
import {
  hashMessage,
  privateKeyToAddress,
  signMessage,
  toChecksumAddress,
} from '../src/rest/signing';

// Vecteur réel publié dans la doc Aster (aster-finance-futures-api-v3, exemple POST order) :
// la clé privée du signer correspond à cette adresse d'API wallet.
const DOC_PRIVATE_KEY: Hex = '0x4fd0a42218f3eae43a6ce26d22544e986139a01e5b34a62db53757ffca81bae1';
const DOC_SIGNER = '0x21cF8Ae13Bb72632562c6Fff438652Ba1a151bb0';

describe('privateKeyToAddress', () => {
  it('dérive l’adresse signer du vecteur de la doc (secp256k1 + keccak + EIP-55)', () => {
    expect(privateKeyToAddress(DOC_PRIVATE_KEY)).toBe(DOC_SIGNER);
  });
});

describe('toChecksumAddress', () => {
  it('applique le checksum EIP-55 à une adresse minuscule', () => {
    expect(toChecksumAddress(DOC_SIGNER.toLowerCase())).toBe(DOC_SIGNER);
  });
});

describe('signMessage', () => {
  it('produit une signature qui se recouvre vers l’adresse signer', () => {
    const msg = 'symbol=ASTERUSDT&side=BUY&type=MARKET&quantity=20&nonce=1748310859508867';
    const signature = signMessage(msg, DOC_PRIVATE_KEY, AGENT_CHAIN_ID.mainnet);

    expect(signature).toMatch(/^0x[0-9a-f]{130}$/);

    // Round-trip : la clé publique recouvrée depuis (digest, signature) est bien celle
    // du signer — preuve que signMessage et hashMessage sont cohérents.
    const digest = hashMessage(msg, AGENT_CHAIN_ID.mainnet);
    const r = BigInt(`0x${signature.slice(2, 66)}`);
    const s = BigInt(`0x${signature.slice(66, 130)}`);
    const v = Number.parseInt(signature.slice(130, 132), 16);
    const recovered = new secp256k1.Signature(r, s, v - 27).recoverPublicKey(digest);
    const expected = secp256k1.getPublicKey(hexToBytes(DOC_PRIVATE_KEY.slice(2)), false);
    expect(recovered.toRawBytes(false)).toStrictEqual(expected);
  });
});

describe('serializeParams', () => {
  it('conserve l’ordre d’insertion et omet les undefined', () => {
    const out = serializeParams({ symbol: 'BTCUSDT', side: 'BUY', price: undefined, qty: '1' });
    expect(out).toBe('symbol=BTCUSDT&side=BUY&qty=1');
  });

  it('encode les espaces en + (quote_plus) et JSON-ifie les tableaux', () => {
    expect(serializeParams({ ipWhitelist: '1.1.1.1 2.2.2.2' })).toBe('ipWhitelist=1.1.1.1+2.2.2.2');
    expect(serializeParams({ ids: ['a', 'b'] })).toBe('ids=%5B%22a%22%2C%22b%22%5D');
  });
});

describe('microsecondNonce', () => {
  it('est strictement croissant', () => {
    const a = BigInt(microsecondNonce());
    const b = BigInt(microsecondNonce());
    const c = BigInt(microsecondNonce());
    expect(b).toBeGreaterThan(a);
    expect(c).toBeGreaterThan(b);
  });
});
