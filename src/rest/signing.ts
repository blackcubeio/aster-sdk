import { ed25519 } from '@noble/curves/ed25519';
import { secp256k1 } from '@noble/curves/secp256k1';
import { keccak_256 } from '@noble/hashes/sha3';
import { bytesToHex, concatBytes, hexToBytes, utf8ToBytes } from '@noble/hashes/utils';
import bs58 from 'bs58';
import type { AsterClient } from '../common/config';
import {
  AGENT_CHAIN_ID,
  EIP712_DOMAIN_NAME,
  EIP712_DOMAIN_VERSION,
  SIGNATURE_CHAIN_ID,
  ZERO_ADDRESS,
} from '../common/constants';
import type { ResolvedSigner, SignedForm } from '../common/types';
import type { Hex, JsonValue, KeyType, Network, Signature, Signer } from '../common/types';
import { microsecondNonce, serializeParams } from '../common/utils';

/** Une clé EVM est préfixée `0x` ; sinon elle est traitée comme une clé Solana (base58). */
export function keyTypeOf(privateKey: string): KeyType {
  return privateKey.startsWith('0x') ? 'evm' : 'solana';
}

/** Graine ed25519 (32 octets) d'une clé privée Solana base58 (64 → 32 si keypair complet). */
function solanaSeed(privateKey: string): Uint8Array {
  const decoded = bs58.decode(privateKey);
  return decoded.length === 64 ? decoded.slice(0, 32) : decoded;
}

/** Adresse Solana (pubkey base58) dérivée d'une clé privée base58. */
export function solanaAddress(privateKey: string): string {
  return bs58.encode(ed25519.getPublicKey(solanaSeed(privateKey)));
}

/** Signature ed25519 (base58) du message, pour un compte Solana. */
export function signEd25519(msg: string, privateKey: string): string {
  return bs58.encode(ed25519.sign(utf8ToBytes(msg), solanaSeed(privateKey)));
}

interface Eip712Field {
  name: string;
  type: string;
}
type Eip712Types = Record<string, Eip712Field[]>;
interface Eip712Domain {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: Hex;
}

const DOMAIN_TYPE: Eip712Types = {
  EIP712Domain: [
    { name: 'name', type: 'string' },
    { name: 'version', type: 'string' },
    { name: 'chainId', type: 'uint256' },
    { name: 'verifyingContract', type: 'address' },
  ],
};

// Aster enveloppe la charge à signer dans un type EIP-712 plat `Message { msg: string }`,
// où `msg` est la querystring url-encodée de la requête (cf. aster-finance-*-api-v3).
const MESSAGE_TYPE: Eip712Types = {
  Message: [{ name: 'msg', type: 'string' }],
};

function bigintToBytes32(value: bigint): Uint8Array {
  const bytes = new Uint8Array(32);
  let remaining = value;
  for (let i = 31; i >= 0; i--) {
    bytes[i] = Number(remaining & 0xffn);
    remaining >>= 8n;
  }
  return bytes;
}

function encodeType(primaryType: string, types: Eip712Types): string {
  // Types Aster plats (aucune struct imbriquée) : pas de résolution de dépendances.
  const fields = types[primaryType] ?? [];
  return `${primaryType}(${fields.map((field) => `${field.type} ${field.name}`).join(',')})`;
}

function encodeField(type: string, value: unknown): Uint8Array {
  if (type === 'string') {
    return keccak_256(utf8ToBytes(value as string));
  }
  if (type === 'bytes32') {
    return hexToBytes((value as string).slice(2));
  }
  if (type === 'address') {
    const out = new Uint8Array(32);
    out.set(hexToBytes((value as string).slice(2)), 12);
    return out;
  }
  if (type === 'bool') {
    const out = new Uint8Array(32);
    out[31] = value === true ? 1 : 0;
    return out;
  }
  if (type.startsWith('uint') === true || type.startsWith('int') === true) {
    return bigintToBytes32(BigInt(value as number | bigint | string));
  }
  throw new Error(`Type EIP-712 non supporté : ${type}`);
}

function hashStruct(
  primaryType: string,
  types: Eip712Types,
  data: Record<string, unknown>,
): Uint8Array {
  const parts: Uint8Array[] = [keccak_256(utf8ToBytes(encodeType(primaryType, types)))];
  for (const field of types[primaryType] ?? []) {
    parts.push(encodeField(field.type, data[field.name]));
  }
  return keccak_256(concatBytes(...parts));
}

function hashTypedData(
  domain: Eip712Domain,
  types: Eip712Types,
  primaryType: string,
  message: Record<string, unknown>,
): Uint8Array {
  const domainSeparator = hashStruct(
    'EIP712Domain',
    DOMAIN_TYPE,
    domain as unknown as Record<string, unknown>,
  );
  const structHash = hashStruct(primaryType, types, message);
  return keccak_256(concatBytes(new Uint8Array([0x19, 0x01]), domainSeparator, structHash));
}

function signDigest(digest: Uint8Array, privateKey: Hex): Signature {
  const sig = secp256k1.sign(digest, hexToBytes(privateKey.slice(2)));
  const r = bytesToHex(bigintToBytes32(sig.r));
  const s = bytesToHex(bigintToBytes32(sig.s));
  const v = (sig.recovery + 27).toString(16).padStart(2, '0');
  return `0x${r}${s}${v}`;
}

/**
 * Digest EIP-712 du message `msg` (querystring url-encodée) pour le domaine
 * `AsterSignTransaction` / type `Message { msg }`. Le `chainId` distingue l'environnement :
 * 1666 (mainnet) ou 714 (testnet) pour la signature **agent**.
 */
export function hashMessage(msg: string, chainId: number): Uint8Array {
  return hashTypedData(
    {
      name: EIP712_DOMAIN_NAME,
      version: EIP712_DOMAIN_VERSION,
      chainId,
      verifyingContract: ZERO_ADDRESS,
    },
    MESSAGE_TYPE,
    'Message',
    { msg },
  );
}

/**
 * Signe une charge EIP-712 **arbitraire** (domaine et types fournis explicitement). Bas
 * niveau, pour les flux qui sortent du domaine `AsterSignTransaction` — ex. le retrait spot
 * (domaine `Aster`, type `Action`, champs `address`/`uint256`).
 */
export function signEip712(
  domain: { name: string; version: string; chainId: number; verifyingContract: Hex },
  types: Record<string, { name: string; type: string }[]>,
  primaryType: string,
  message: Record<string, unknown>,
  privateKey: Hex,
): Signature {
  return signDigest(hashTypedData(domain, types, primaryType, message), privateKey);
}

function inferEip712Type(value: JsonValue): string {
  if (typeof value === 'boolean') {
    return 'bool';
  }
  if (typeof value === 'number') {
    return 'uint256';
  }
  return 'string';
}

/**
 * Signe une charge **EIP-712 typée dynamiquement** (domaine `AsterSignTransaction`,
 * `chainId` = 56 BNB), utilisée par la gestion d'agents/builders legacy (approveAgent,
 * updateAgent, delAgent…). Le `primaryType` nomme l'action ; les champs (ordre conservé)
 * sont typés par inférence (`bool`/`uint256`/`string`). L'appelant fournit les clés
 * **déjà capitalisées** attendues par le backend.
 */
export function signDynamicTypedData(
  primaryType: string,
  message: Record<string, JsonValue>,
  privateKey: Hex,
  chainId: number,
): Signature {
  const types: Eip712Types = {
    [primaryType]: Object.keys(message).map((name) => ({
      name,
      type: inferEip712Type(message[name] as JsonValue),
    })),
  };
  const digest = hashTypedData(
    {
      name: EIP712_DOMAIN_NAME,
      version: EIP712_DOMAIN_VERSION,
      chainId,
      verifyingContract: ZERO_ADDRESS,
    },
    types,
    primaryType,
    message,
  );
  return signDigest(digest, privateKey);
}

/**
 * Signe le message `msg` avec l'EIP-712 agent (cf. {@link hashMessage}). Renvoie la
 * signature ECDSA secp256k1 sérialisée `r ‖ s ‖ v` (65 octets, préfixée `0x`).
 */
export function signMessage(msg: string, privateKey: Hex, chainId: number): Signature {
  return signDigest(hashMessage(msg, chainId), privateKey);
}

/**
 * Signe la querystring `msg` selon le **type de clé** : EVM (`0x…`) → EIP-712 `Message{msg}`
 * (secp256k1, hex, chainId du réseau) ; Solana → ed25519 sur les octets bruts du message
 * (base58). C'est le point d'aiguillage EVM/Solana de toutes les requêtes signées.
 */
export function signQueryString(msg: string, privateKey: string, network: Network): Signature {
  return keyTypeOf(privateKey) === 'solana'
    ? signEd25519(msg, privateKey)
    : signMessage(msg, privateKey as Hex, AGENT_CHAIN_ID[network]);
}

/** Adresse EVM checksummée (EIP-55) dérivée d'une clé privée secp256k1. */
export function privateKeyToAddress(privateKey: Hex): Hex {
  const publicKey = secp256k1.getPublicKey(hexToBytes(privateKey.slice(2)), false);
  const address = bytesToHex(keccak_256(publicKey.slice(1)).slice(12));
  return toChecksumAddress(address);
}

/** Applique le checksum EIP-55 à une adresse hex (avec ou sans préfixe `0x`). */
export function toChecksumAddress(address: string): Hex {
  const lower = address.toLowerCase().replace(/^0x/, '');
  const hash = bytesToHex(keccak_256(utf8ToBytes(lower)));
  let result = '0x';
  for (let i = 0; i < lower.length; i++) {
    result += Number.parseInt(hash[i] as string, 16) >= 8 ? lower[i]?.toUpperCase() : lower[i];
  }
  return result as Hex;
}

/** Adresse (EVM checksummée ou Solana base58) dérivée d'une clé privée selon son type. */
function addressFromKey(privateKey: string): string {
  return keyTypeOf(privateKey) === 'solana'
    ? solanaAddress(privateKey)
    : privateKeyToAddress(privateKey as Hex);
}

/**
 * Résout le signer d'une **écriture** par son label. Obligatoire : lève si le label est
 * absent ou inconnu. Le `keyType` est déduit de `privateKey` (`0x…` → EVM, sinon Solana) ;
 * `signer` est dérivé de `privateKey` s'il n'est pas fourni explicitement.
 */
export function resolveSigner(client: AsterClient, label?: string): ResolvedSigner {
  if (label === undefined) {
    throw new Error('Un signer (label) est obligatoire pour cette action signée');
  }
  const signer = client.signers[label];
  if (signer === undefined) {
    throw new Error(`Aucun signer enregistré sous "${label}"; ajoute-le dans init({ signers })`);
  }
  return {
    label,
    keyType: keyTypeOf(signer.privateKey),
    user: signer.user,
    signer: signer.signer ?? addressFromKey(signer.privateKey),
    privateKey: signer.privateKey,
    mainPrivateKey: signer.mainPrivateKey,
    network: signer.network,
  };
}

/** Account address for a raw signer (used where a Signer is passed directly). */
export function signerAddress(signer: Signer): string {
  return signer.signer ?? addressFromKey(signer.privateKey);
}

/**
 * Résout le **main wallet** d'une action de gestion de compte (approveAgent, migrate…).
 * En **Solana**, la même clé fait tout : `mainPrivateKey` retombe sur `privateKey`. En EVM,
 * `mainPrivateKey` est obligatoire et lève s'il est absent.
 */
export function resolveMainSigner(
  client: AsterClient,
  label?: string,
): ResolvedSigner & { mainPrivateKey: string } {
  const resolved = resolveSigner(client, label);
  const mainPrivateKey =
    resolved.mainPrivateKey ?? (resolved.keyType === 'solana' ? resolved.privateKey : undefined);
  if (mainPrivateKey === undefined) {
    throw new Error(
      `Le signer "${resolved.label}" n'a pas de mainPrivateKey ; requis pour les actions signées par le compte principal`,
    );
  }
  return { ...resolved, mainPrivateKey };
}

/** Lève si le signer est un compte Solana, pour les fonctionnalités EVM-only (sous-comptes). */
export function assertEvmSigner(
  client: AsterClient,
  label: string | undefined,
  feature: string,
): void {
  if (resolveSigner(client, label).keyType === 'solana') {
    throw new Error(`${feature} : non supporté pour un compte Solana (agent EVM requis).`);
  }
}

/**
 * Cœur générique : sérialise des paramètres **déjà ordonnés** en querystring, signe cette
 * chaîne exacte (EIP-712 Message{msg}, chainId du réseau), et appose `&signature=…`. La
 * chaîne est transmise telle quelle pour que le serveur reconstruise un `msg` identique.
 * L'ordre des champs fait partie du message : l'appelant le maîtrise.
 */
export function buildSignedForm(
  orderedParams: Record<string, JsonValue | undefined>,
  privateKey: string,
  network: Network,
): SignedForm {
  const msg = serializeParams(orderedParams);
  const signature = signQueryString(msg, privateKey, network);
  return { body: `${msg}&signature=${signature}`, network };
}

/**
 * Construit une requête signée **agent** (TRADE / USER_DATA) : ajoute `nonce` (µs), `user`
 * (compte principal) et `signer` (API wallet) aux paramètres métier, puis signe avec la clé
 * de l'API wallet. `user` est requis par le backend (vérifié sur testnet) pour résoudre le
 * compte associé à l'agent.
 */
export function buildSignedRequest(
  client: AsterClient,
  params: Record<string, JsonValue | undefined>,
  label?: string,
): SignedForm {
  const resolved = resolveSigner(client, label);
  return buildSignedForm(
    { ...params, nonce: microsecondNonce(), user: resolved.user, signer: resolved.signer },
    resolved.privateKey,
    resolved.network,
  );
}

function capitalizeKeys(params: Record<string, JsonValue>): Record<string, JsonValue> {
  const out: Record<string, JsonValue> = {};
  for (const key of Object.keys(params)) {
    out[`${key.charAt(0).toUpperCase()}${key.slice(1)}`] = params[key] as JsonValue;
  }
  return out;
}

/**
 * Construit une requête de **gestion d'agent/builder legacy**, signée par le compte
 * principal en EIP-712 **typé dynamique** (chainId 56). Ajoute `asterChain`, `user`,
 * `nonce` aux paramètres métier (ordre conservé), signe le message à clés capitalisées
 * (`primaryType` = nom de l'action), et transmet les paramètres en clés d'origine +
 * `signatureChainId` + `signature`.
 */
export function buildMainTypedRequest(
  client: AsterClient,
  primaryType: string,
  params: Record<string, JsonValue>,
  label?: string,
): SignedForm {
  const resolved = resolveMainSigner(client, label);
  // Solana : ed25519 sur la querystring brute `{…params, nonce, user}` (cf. sol_agent.py),
  // sans `asterChain`/`signatureChainId` ni typage dynamique (réservé à l'EVM).
  if (resolved.keyType === 'solana') {
    const ordered: Record<string, JsonValue> = {
      ...params,
      nonce: Number(microsecondNonce()),
      user: resolved.user,
    };
    const msg = serializeParams(ordered);
    return {
      body: `${msg}&signature=${signEd25519(msg, resolved.mainPrivateKey)}`,
      network: resolved.network,
    };
  }
  const full: Record<string, JsonValue> = {
    ...params,
    asterChain: resolved.network === 'mainnet' ? 'Mainnet' : 'Testnet',
    user: resolved.user,
    nonce: Number(microsecondNonce()),
  };
  const signature = signDynamicTypedData(
    primaryType,
    capitalizeKeys(full),
    resolved.mainPrivateKey as Hex,
    SIGNATURE_CHAIN_ID,
  );
  const body = serializeParams({ ...full, signatureChainId: SIGNATURE_CHAIN_ID, signature });
  return { body, network: resolved.network };
}

/** Identifiant client d'ordre unique (respecte `^[\.A-Z\:/a-z0-9_-]{1,36}$`). */
export function newClientOrderId(): string {
  return globalThis.crypto.randomUUID().replace(/-/g, '');
}
