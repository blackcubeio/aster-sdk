// Aster expose deux produits sur des hôtes distincts : futures (fapi/fstream) et
// spot (sapi/sstream). Chacun a son réseau mainnet et testnet.

export const FUTURES_REST_URL = 'https://fapi.asterdex.com';
export const FUTURES_WS_URL = 'wss://fstream.asterdex.com';
export const SPOT_REST_URL = 'https://sapi.asterdex.com';
export const SPOT_WS_URL = 'wss://sstream.asterdex.com';

export const TESTNET_FUTURES_REST_URL = 'https://fapi.asterdex-testnet.com';
export const TESTNET_FUTURES_WS_URL = 'wss://fstream.asterdex-testnet.com';
export const TESTNET_SPOT_REST_URL = 'https://sapi.asterdex-testnet.com';
export const TESTNET_SPOT_WS_URL = 'wss://sstream.asterdex-testnet.com';

// Prediction markets : host dédié `papi`. L'API Prediction est **testnet-only** à ce jour
// (le host mainnet est un best-guess parallèle, non garanti tant que Prediction n'est pas en prod).
export const PREDICTION_REST_URL = 'https://papi.asterdex.com';
export const TESTNET_PREDICTION_REST_URL = 'https://papi.asterdex-testnet.com';
// WS prediction (`pstream`, parallèle à fstream/sstream) — non câblé pour l'instant ; placeholders
// pour satisfaire le type `Record<Product, …>`. À reconfirmer avant d'exposer un scope WS prediction.
export const PREDICTION_WS_URL = 'wss://pstream.asterdex.com';
export const TESTNET_PREDICTION_WS_URL = 'wss://pstream.asterdex-testnet.com';

/**
 * chainId du domaine EIP-712 pour la signature **agent** (trading & user_data) :
 * Aster L1 mainnet = 1666, testnet = 714. Ne pas confondre avec `SIGNATURE_CHAIN_ID`
 * de la gestion de compte (main wallet).
 */
export const AGENT_CHAIN_ID = { mainnet: 1666, testnet: 714 } as const;

/**
 * `signatureChainId` envoyé par les endpoints de gestion de compte (approveAgent,
 * sous-comptes, withdraw, migrate…) signés par le main wallet EVM : 56 (BNB Chain).
 *
 * ⚠️ La doc Aster est contradictoire (table « Supported Algorithms » = 56, mais le
 * template EIP-712 montre 1666/714). À confirmer empiriquement contre le testnet
 * avant d'implémenter le groupe account-management.
 */
export const SIGNATURE_CHAIN_ID = 56;

/** Domaine EIP-712 commun à toutes les signatures Aster. */
export const EIP712_DOMAIN_NAME = 'AsterSignTransaction';
export const EIP712_DOMAIN_VERSION = '1';
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;

/**
 * Le nonce (timestamp microseconde) doit rester à moins de 10 s du temps serveur,
 * sinon la requête est rejetée (replay protection V3).
 */
export const NONCE_MAX_SKEW_MS = 10_000;
export const WS_HEARTBEAT_INTERVAL = 30_000;
