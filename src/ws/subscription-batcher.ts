/**
 * Coalescing + throttling des messages SUBSCRIBE/UNSUBSCRIBE d'une socket combined (Aster/Binance).
 *
 * Aster limite une connexion à **10 messages entrants par seconde** ; au-delà la socket est fermée (et l'IP peut
 * finir bannie). Émettre un message par stream inonde dès qu'on suit beaucoup de paires (ex. tous les perps).
 * Ce batcher accumule les streams sur un micro-tick et émet **un** message par lot (jusqu'à `chunk` streams),
 * espacés de `intervalMs`. Le format de wire (`{ method, params, id }`) et l'API publique des clients restent
 * inchangés : c'est purement interne à l'émission.
 */
export class SubscriptionBatcher {
  private readonly pendingSub = new Set<string>();
  private readonly pendingUnsub = new Set<string>();
  private readonly outbox: string[] = [];
  private flushScheduled = false;
  private draining = false;
  private open = false;
  private nextId = 1;

  /**
   * @param rawSend   Émet une frame déjà sérialisée sur la socket.
   * @param chunk     Nombre max de streams par message SUBSCRIBE/UNSUBSCRIBE.
   * @param intervalMs Espacement minimal entre deux messages (≤ 10/s côté Aster).
   */
  constructor(
    private readonly rawSend: (frame: string) => void,
    private readonly chunk = 100,
    private readonly intervalMs = 150,
  ) {}

  /** Marque un stream à souscrire (annule un unsubscribe en attente du même). */
  public subscribe(name: string): void {
    this.pendingUnsub.delete(name);
    this.pendingSub.add(name);
    this.schedule();
  }

  /** Marque un stream à désouscrire (annule un subscribe en attente du même). */
  public unsubscribe(name: string): void {
    this.pendingSub.delete(name);
    this.pendingUnsub.add(name);
    this.schedule();
  }

  /** Ré-souscrit en masse (reconnexion) : rejoue tous les streams encore suivis. */
  public resubscribe(names: Iterable<string>): void {
    for (const name of names) {
      this.pendingUnsub.delete(name);
      this.pendingSub.add(name);
    }
    this.schedule();
  }

  /** Bascule l'état de la socket : à l'ouverture, on draine la file (throttlée). */
  public setOpen(isOpen: boolean): void {
    this.open = isOpen;
    if (isOpen === true) {
      this.pump();
    }
  }

  /** Vide la file d'envoi (socket fermée) ; les streams suivis sont rejoués via `resubscribe` au reconnect. */
  public reset(): void {
    this.outbox.length = 0;
    this.draining = false;
  }

  private schedule(): void {
    if (this.flushScheduled === true) {
      return;
    }
    this.flushScheduled = true;
    queueMicrotask(() => {
      this.flushScheduled = false;
      this.flush();
    });
  }

  private flush(): void {
    this.enqueue('UNSUBSCRIBE', this.pendingUnsub);
    this.pendingUnsub.clear();
    this.enqueue('SUBSCRIBE', this.pendingSub);
    this.pendingSub.clear();
  }

  private enqueue(method: 'SUBSCRIBE' | 'UNSUBSCRIBE', names: Set<string>): void {
    const all = [...names];
    for (let i = 0; i < all.length; i += this.chunk) {
      const params = all.slice(i, i + this.chunk);
      this.outbox.push(JSON.stringify({ method, params, id: this.nextId++ }));
    }
    this.pump();
  }

  private pump(): void {
    if (this.draining === true || this.open === false || this.outbox.length === 0) {
      return;
    }
    this.draining = true;
    const frame = this.outbox.shift() as string;
    this.rawSend(frame);
    setTimeout(() => {
      this.draining = false;
      this.pump();
    }, this.intervalMs);
  }
}
