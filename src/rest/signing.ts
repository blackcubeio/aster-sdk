import { secp256k1 } from '@noble/curves/secp256k1';
import { keccak_256 } from '@noble/hashes/sha3';
import { bytesToHex, concatBytes, hexToBytes, utf8ToBytes } from '@noble/hashes/utils';
import { getConfig } from '../common/config';
import {
  AGENT_CHAIN_ID,
  EIP712_DOMAIN_NAME,
  EIP712_DOMAIN_VERSION,
  ZERO_ADDRESS,
} from '../common/constants';
import type { Hex, JsonValue, Network, Signature, Signer } from '../common/types';
import { microsecondNonce, serializeParams } from '../common/utils';

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

export interface ResolvedSigner {
  label: string;
  user: Hex;
  signer: Hex;
  privateKey: Hex;
  mainPrivateKey?: Hex;
  network: Network;
}

/**
 * Résout le signer d'une **écriture** par son label. Obligatoire : lève si le label est
 * absent ou inconnu. `signer` (adresse de l'API wallet) est dérivé de `privateKey` s'il
 * n'est pas fourni explicitement.
 */
export function resolveSigner(label?: string): ResolvedSigner {
  if (label === undefined) {
    throw new Error('Un signer (label) est obligatoire pour cette action signée');
  }
  const signer = getConfig().signers[label];
  if (signer === undefined) {
    throw new Error(`Aucun signer enregistré sous "${label}"; ajoute-le dans init({ signers })`);
  }
  return {
    label,
    user: signer.user,
    signer: signer.signer ?? privateKeyToAddress(signer.privateKey),
    privateKey: signer.privateKey,
    mainPrivateKey: signer.mainPrivateKey,
    network: signer.network,
  };
}

/** Account address for a raw signer (used where a Signer is passed directly). */
export function signerAddress(signer: Signer): Hex {
  return signer.signer ?? privateKeyToAddress(signer.privateKey);
}

/**
 * Résout le **main wallet** d'une action de gestion de compte (approveAgent, sous-comptes,
 * withdraw, migrate…). `mainPrivateKey` est obligatoire pour ces actions signées par le
 * compte principal ; lève s'il est absent.
 */
export function resolveMainSigner(label?: string): ResolvedSigner & { mainPrivateKey: Hex } {
  const resolved = resolveSigner(label);
  if (resolved.mainPrivateKey === undefined) {
    throw new Error(
      `Le signer "${resolved.label}" n'a pas de mainPrivateKey ; requis pour les actions signées par le compte principal`,
    );
  }
  return { ...resolved, mainPrivateKey: resolved.mainPrivateKey };
}

export interface SignedForm {
  /** Corps `application/x-www-form-urlencoded` complet, signature incluse. */
  body: string;
  network: Network;
}

/**
 * Cœur générique : sérialise des paramètres **déjà ordonnés** en querystring, signe cette
 * chaîne exacte (EIP-712 Message{msg}, chainId du réseau), et appose `&signature=…`. La
 * chaîne est transmise telle quelle pour que le serveur reconstruise un `msg` identique.
 * L'ordre des champs fait partie du message : l'appelant le maîtrise.
 */
export function buildSignedForm(
  orderedParams: Record<string, JsonValue | undefined>,
  privateKey: Hex,
  network: Network,
): SignedForm {
  const msg = serializeParams(orderedParams);
  const signature = signMessage(msg, privateKey, AGENT_CHAIN_ID[network]);
  return { body: `${msg}&signature=${signature}`, network };
}

/**
 * Construit une requête signée **agent** (TRADE / USER_DATA) : ajoute `nonce` (µs), `user`
 * (compte principal) et `signer` (API wallet) aux paramètres métier, puis signe avec la clé
 * de l'API wallet. `user` est requis par le backend (vérifié sur testnet) pour résoudre le
 * compte associé à l'agent.
 */
export function buildSignedRequest(
  params: Record<string, JsonValue | undefined>,
  label?: string,
): SignedForm {
  const resolved = resolveSigner(label);
  return buildSignedForm(
    { ...params, nonce: microsecondNonce(), user: resolved.user, signer: resolved.signer },
    resolved.privateKey,
    resolved.network,
  );
}

/** Identifiant client d'ordre unique (respecte `^[\.A-Z\:/a-z0-9_-]{1,36}$`). */
export function newClientOrderId(): string {
  return globalThis.crypto.randomUUID().replace(/-/g, '');
}
