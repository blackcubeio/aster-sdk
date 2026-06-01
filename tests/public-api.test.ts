import { describe, expect, it } from 'vitest';
// Vérif de la **surface publique** : chaque symbole présenté dans la doc comme importable depuis
// '@blackcube/aster-sdk' (valeur ou type) doit l'être réellement depuis le point d'entrée `../src`.
// On importe ici exactement comme la doc, et on asserte l'existence runtime des **valeurs**.
import {
  Aster,
  type AsterDexOptions,
  type Balance,
  type Candle,
  type Order,
  type Pair,
  type Signer,
  StrategyType,
  type Unsubscribe,
  buildSignedRequest,
  hashMessage,
  privateKeyToAddress,
  signMessage,
} from '../src';

describe('Surface publique du package (valeurs exportées)', () => {
  it('exporte la façade `Aster` comme valeur (classe)', () => {
    expect(typeof Aster).toBe('function');
    // Construction sans signer (lectures publiques) : pas d'effet réseau ici.
    const dex = new Aster();
    expect(typeof dex.perp).toBe('function');
    expect(typeof dex.native).toBe('object');
  });

  it("exporte l'enum `StrategyType` comme valeur (doc native.md `placeStrategy`)", () => {
    expect(typeof StrategyType).toBe('object');
    expect(StrategyType.Oto).toBe('OTO');
    expect(StrategyType.Oco).toBe('OCO');
    expect(StrategyType.Otoco).toBe('OTOCO');
  });

  it('exporte les helpers de signature comme valeurs (doc signing.md)', () => {
    expect(typeof buildSignedRequest).toBe('function');
    expect(typeof signMessage).toBe('function');
    expect(typeof hashMessage).toBe('function');
    expect(typeof privateKeyToAddress).toBe('function');
  });

  it('`privateKeyToAddress` dérive bien une adresse EVM (helper réellement câblé)', () => {
    // Vecteur clé/adresse déterministe (clé = 1). Exerce le symbole exporté, sans réseau.
    const address = privateKeyToAddress(
      '0x0000000000000000000000000000000000000000000000000000000000000001',
    );
    expect(address).toBe('0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf');
  });
});

describe('Surface publique du package (types exportés)', () => {
  it('expose les types documentés (bloc de vérif de type)', () => {
    // Ce bloc ne s'exécute pas réellement : il force tsc à valider que les types sont exportés
    // et bien formés (la doc les montre en import de type).
    const exercise = (): void => {
      const _opts: AsterDexOptions = { default: 'desk' };
      const _signer: Signer = { privateKey: '0x', user: '0x', network: 'testnet' };
      const _pair: Pick<Pair, 'name' | 'kind'> = { name: 'BTCUSDT', kind: 'perp' };
      const _candle: Pick<Candle, 's' | 'kind'> = { s: 'BTCUSDT', kind: 'perp' };
      const _order: Pick<Order, 'id' | 'status'> = { id: '1', status: 'open' };
      const _balance: Pick<Balance, 'asset'> = { asset: 'USDT' };
      const _off: Unsubscribe = () => undefined;
      void _opts;
      void _signer;
      void _pair;
      void _candle;
      void _order;
      void _balance;
      void _off;
    };
    expect(typeof exercise).toBe('function');
  });
});
