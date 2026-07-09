import { beforeAll, describe, expect, it } from 'vitest';
import { type AsterClient, init } from '../src/common/config';
import { type Hex, OrderSide, OrderType, TimeInForce } from '../src/common/types';
import { buildOrderPayload, buildOrderRef } from '../src/rest/futures/trade/payloads';
import { buildSignedRequest } from '../src/rest/signing';

const DOC_PRIVATE_KEY: Hex = '0x4fd0a42218f3eae43a6ce26d22544e986139a01e5b34a62db53757ffca81bae1';
const DOC_SIGNER = '0x21cF8Ae13Bb72632562c6Fff438652Ba1a151bb0';

describe('buildOrderPayload', () => {
  it('garde les champs définis et génère un newClientOrderId', () => {
    const payload = buildOrderPayload({
      symbol: 'BTCUSDT',
      side: OrderSide.Buy,
      type: OrderType.Limit,
      timeInForce: TimeInForce.Gtc,
      quantity: '0.01',
      price: '50000',
    });
    expect(payload.symbol).toBe('BTCUSDT');
    expect(payload.side).toBe('BUY');
    expect(payload.type).toBe('LIMIT');
    expect(payload.timeInForce).toBe('GTC');
    expect(payload.quantity).toBe('0.01');
    expect(payload.price).toBe('50000');
    expect(typeof payload.newClientOrderId).toBe('string');
    expect(payload).not.toHaveProperty('stopPrice');
  });

  it('retire `price` sur STOP_MARKET (doc Aster : price interdit sur les *_MARKET)', () => {
    const payload = buildOrderPayload({
      symbol: 'BTCUSDT',
      side: OrderSide.Sell,
      type: OrderType.StopMarket,
      quantity: '0.01',
      price: '48000',
      stopPrice: '48000',
      reduceOnly: true,
    });
    expect(payload).not.toHaveProperty('price');
    expect(payload.stopPrice).toBe('48000');
    expect(payload.reduceOnly).toBe('true');
  });

  it('sérialise reduceOnly en STRING "true"/"false" (doc Aster : type STRING, exigé par batchOrders)', () => {
    const on = buildOrderPayload({
      symbol: 'BTCUSDT',
      side: OrderSide.Sell,
      type: OrderType.StopMarket,
      quantity: '0.01',
      stopPrice: '48000',
      reduceOnly: true,
    });
    const off = buildOrderPayload({
      symbol: 'BTCUSDT',
      side: OrderSide.Buy,
      type: OrderType.Limit,
      timeInForce: TimeInForce.Gtc,
      quantity: '0.01',
      price: '50000',
      reduceOnly: false,
    });
    expect(on.reduceOnly).toBe('true');
    expect(off.reduceOnly).toBe('false');
    // dans le JSON du batch, le booléen serait rejeté : on veut bien une string
    expect(JSON.stringify(on)).toContain('"reduceOnly":"true"');
  });

  it('retire `price` sur TAKE_PROFIT_MARKET', () => {
    const payload = buildOrderPayload({
      symbol: 'BTCUSDT',
      side: OrderSide.Sell,
      type: OrderType.TakeProfitMarket,
      quantity: '0.01',
      price: '52000',
      stopPrice: '52000',
    });
    expect(payload).not.toHaveProperty('price');
    expect(payload.stopPrice).toBe('52000');
  });

  it('retire `price` sur MARKET', () => {
    const payload = buildOrderPayload({
      symbol: 'BTCUSDT',
      side: OrderSide.Buy,
      type: OrderType.Market,
      quantity: '0.01',
      price: '50000',
    });
    expect(payload).not.toHaveProperty('price');
  });

  it('garde `price` sur STOP (conditionnel LIMITE : price requis par la doc)', () => {
    const payload = buildOrderPayload({
      symbol: 'BTCUSDT',
      side: OrderSide.Sell,
      type: OrderType.Stop,
      quantity: '0.01',
      price: '48000',
      stopPrice: '48500',
    });
    expect(payload.price).toBe('48000');
    expect(payload.stopPrice).toBe('48500');
  });
});

describe('buildOrderRef', () => {
  it('priorise orderId sur origClientOrderId', () => {
    expect(buildOrderRef('BTCUSDT', 42, 'abc')).toEqual({ symbol: 'BTCUSDT', orderId: 42 });
  });

  it('retombe sur origClientOrderId', () => {
    expect(buildOrderRef('BTCUSDT', undefined, 'abc')).toEqual({
      symbol: 'BTCUSDT',
      origClientOrderId: 'abc',
    });
  });

  it('lève si aucun identifiant', () => {
    expect(() => buildOrderRef('BTCUSDT')).toThrow(/orderId/);
  });
});

describe('buildSignedRequest (interne ; client ctx-aware)', () => {
  let client: AsterClient;
  beforeAll(() => {
    client = init({
      signers: {
        trader: {
          privateKey: DOC_PRIVATE_KEY,
          user: '0x63DD5aCC6b1aa0f563956C0e534DD30B6dcF7C4e',
          signer: DOC_SIGNER,
          network: 'mainnet',
        },
      },
    });
  });

  it('appose nonce, signer puis signature dans l’ordre, en gardant les params métier', () => {
    const { body, network } = buildSignedRequest(
      client,
      { symbol: 'BTCUSDT', side: 'BUY', type: 'MARKET', quantity: '0.01' },
      'trader',
    );
    expect(network).toBe('mainnet');
    expect(body).toMatch(
      new RegExp(
        `^symbol=BTCUSDT&side=BUY&type=MARKET&quantity=0.01&nonce=\\d+&user=0x63DD5aCC6b1aa0f563956C0e534DD30B6dcF7C4e&signer=${DOC_SIGNER}&signature=0x[0-9a-f]{130}$`,
      ),
    );
  });

  it('lève si le label est inconnu', () => {
    expect(() => buildSignedRequest(client, { symbol: 'BTCUSDT' }, 'ghost')).toThrow(/signer/);
  });
});
