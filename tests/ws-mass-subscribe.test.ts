import { beforeAll, describe, expect, it } from 'vitest';
import { type Hex, KlineInterval } from '../src/common/types';
import { Aster } from '../src/dex/aster';

/**
 * Régression : abonner TOUT l'univers perp d'un coup (centaines de symboles) ne doit plus saturer la limite
 * Aster de 10 messages/s par connexion. Le `SubscriptionBatcher` coalesce les SUBSCRIBE en quelques messages
 * throttlés. Avant le fix : flood → socket fermée par le serveur → 0 bougie reçue. Test réel, futures mainnet
 * public (pas de mock) — cohérent avec ws-unified.test.ts.
 */
describe('ws() Aster — abonnement de masse (futures mainnet réel, public)', () => {
  let dex: Aster;

  beforeAll(() => {
    dex = new Aster(
      {
        mn: {
          privateKey: `0x${'11'.repeat(32)}` as Hex,
          user: `0x${'00'.repeat(20)}` as Hex,
          network: 'mainnet',
        },
      },
      { default: 'mn' },
    );
  });

  it('reçoit des bougies multi-symboles malgré ~tous les perps abonnés sur une socket', async () => {
    const pairs = await dex.perp().getPairs();
    const symbols = pairs.map((pair) => pair.name);
    expect(symbols.length).toBeGreaterThan(100); // univers conséquent → l'abonnement naïf saturerait la limite

    const ws = dex.ws(); // un seul client (socket partagée, ref-comptée)
    const seen = new Set<string>();
    let total = 0;
    const offs = symbols.map((name) =>
      ws.subscribeCandles({ name, interval: KlineInterval.OneMinute }, (candle) => {
        total += 1;
        seen.add((candle as unknown as { s: string }).s);
      }),
    );

    await new Promise((resolve) => setTimeout(resolve, 30_000));
    for (const off of offs) {
      off();
    }

    // Avant le `SubscriptionBatcher` : 0 (flood d'abonnements → socket fermée par la limite 10 msg/s,
    // ban). Après : le flux multi-symboles est bien vivant.
    //
    // Note robustesse (spec WS 0.7.0) : abonner ~tous les perps (502) sur **une** socket dépasse les
    // limites d'Aster côté serveur, qui ferme la connexion périodiquement. La reconnexion à **backoff
    // exponentiel** (correcte : on n'inonde plus la venue) espace les tentatives → moins de symboles
    // distincts vus dans une fenêtre courte qu'avec l'ancien reconnect immédiat (qui pilonnait la
    // venue). Le test garde donc un seuil tolérant : ce qu'on prouve, c'est que le batcher évite le
    // ban instantané et qu'un flux multi-symboles survit, pas que les 502 streams tiennent ensemble.
    expect(total).toBeGreaterThan(0);
    expect(seen.size).toBeGreaterThan(3);
  }, 50_000);
});
