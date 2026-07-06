/**
 * Luna — Ed25519 Crypto & Payment Verification Tests
 *
 * Tests the core cryptographic and payment verification logic.
 * Follows the same pattern as Vera's verification.test.ts.
 */
import { describe, it, expect } from 'vitest';
import nacl from 'tweetnacl';

// Import from the blockchain package
import {
  isValidCasperSignature,
  isValidCasperAddress,
  parseAmount,
  formatAmount,
  NETWORK_CASPER_TESTNET,
  SCHEME_EXACT,
} from '@luna/blockchain';
import { verifyCrossChainIdentity, createCrossChainIdentity } from '@luna/blockchain';
import { encodeHex, decodeHex } from '@luna/blockchain';

describe('Casper Address Validation', () => {
  it('accepts valid 66-char Casper addresses with 00 prefix', () => {
    const valid = '00' + 'a'.repeat(64);
    expect(isValidCasperAddress(valid)).toBe(true);
  });

  it('accepts 01 prefix (ED25519)', () => {
    const valid = '01' + 'b'.repeat(64);
    expect(isValidCasperAddress(valid)).toBe(true);
  });

  it('rejects addresses without correct prefix', () => {
    expect(isValidCasperAddress('02' + 'c'.repeat(64))).toBe(false);
    expect(isValidCasperAddress('ff' + 'd'.repeat(64))).toBe(false);
  });

  it('rejects wrong length', () => {
    expect(isValidCasperAddress('00' + 'a'.repeat(62))).toBe(false);
    expect(isValidCasperAddress('00' + 'a'.repeat(66))).toBe(false);
  });

  it('rejects non-hex characters', () => {
    expect(isValidCasperAddress('00' + 'z'.repeat(64))).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidCasperAddress('')).toBe(false);
  });
});

describe('Amount Parsing', () => {
  it('parses whole USDC amounts to atomic units', () => {
    expect(parseAmount('1', 6)).toBe(1_000_000n);
    expect(parseAmount('10', 6)).toBe(10_000_000n);
    expect(parseAmount('0.01', 6)).toBe(10_000n);
  });

  it('parses fractional amounts', () => {
    expect(parseAmount('0.001', 6)).toBe(1_000n);
    expect(parseAmount('0.000001', 6)).toBe(1n);
  });

  it('handles zero', () => {
    expect(parseAmount('0', 6)).toBe(0n);
    expect(parseAmount('0.00', 6)).toBe(0n);
  });

  it('round-trips formatAmount -> parseAmount', () => {
    const amounts = ['0.01', '1.50', '100', '0.000001', '999999.999999'];
    for (const a of amounts) {
      const parsed = parseAmount(a, 6);
      const formatted = formatAmount(parsed, 6);
      expect(parseAmount(formatted, 6)).toBe(parsed);
    }
  });
});

describe('Ed25519 Signature Verification', () => {
  it('verifies a validly signed payload', () => {
    // Generate a real Ed25519 keypair
    const keyPair = nacl.sign.keyPair();

    // Build a valid authorization payload
    const auth = {
      from: '00' + 'a'.repeat(64),
      to: '00' + 'b'.repeat(64),
      value: '10000',
      validAfter: '0',
      validBefore: '9999999999',
      nonce: 'test-nonce-1',
    };

    // Sign the authorization
    const authBytes = new TextEncoder().encode(JSON.stringify(auth));
    const signature = nacl.sign.detached(authBytes, keyPair.secretKey);

    const payload = {
      signature: encodeHex(signature),
      publicKey: encodeHex(keyPair.publicKey),
      authorization: auth,
    };

    expect(isValidCasperSignature(payload)).toBe(true);
  });

  it('rejects a payload signed with a different key', () => {
    const keyPair1 = nacl.sign.keyPair();
    const keyPair2 = nacl.sign.keyPair();

    const auth = {
      from: '00' + 'a'.repeat(64),
      to: '00' + 'b'.repeat(64),
      value: '10000',
      validAfter: '0',
      validBefore: '9999999999',
      nonce: 'test-nonce-2',
    };

    // Sign with key1, but claim key2's public key
    const authBytes = new TextEncoder().encode(JSON.stringify(auth));
    const signature = nacl.sign.detached(authBytes, keyPair1.secretKey);

    const payload = {
      signature: encodeHex(signature),
      publicKey: encodeHex(keyPair2.publicKey), // Different key!
      authorization: auth,
    };

    expect(isValidCasperSignature(payload)).toBe(false);
  });

  it('rejects a tampered authorization payload', () => {
    const keyPair = nacl.sign.keyPair();

    const auth = {
      from: '00' + 'a'.repeat(64),
      to: '00' + 'b'.repeat(64),
      value: '10000',
      validAfter: '0',
      validBefore: '9999999999',
      nonce: 'test-nonce-3',
    };

    // Sign the original
    const authBytes = new TextEncoder().encode(JSON.stringify(auth));
    const signature = nacl.sign.detached(authBytes, keyPair.secretKey);

    // Tamper with the value
    const tamperedAuth = { ...auth, value: '99999' };

    const payload = {
      signature: encodeHex(signature),
      publicKey: encodeHex(keyPair.publicKey),
      authorization: tamperedAuth, // Different value than what was signed
    };

    expect(isValidCasperSignature(payload)).toBe(false);
  });

  it('returns false for malformed payloads', () => {
    expect(isValidCasperSignature({} as never)).toBe(false);
    expect(isValidCasperSignature({ signature: '', publicKey: '', authorization: null } as never)).toBe(false);
  });
});

describe('Cross-Chain Identity Verification', () => {
  it('creates and verifies a cross-chain identity', () => {
    const keyPair = nacl.sign.keyPair();
    const evmAddress = '0x' + 'c'.repeat(40);

    const identity = createCrossChainIdentity(
      keyPair.secretKey,
      evmAddress,
      'base-sepolia',
    );

    expect(identity.casperPublicKey).toBe(encodeHex(keyPair.publicKey));
    expect(identity.evmAddress).toBe(evmAddress);
    expect(identity.evmChain).toBe('base-sepolia');
    expect(identity.signature).toBeTruthy();
    expect(identity.createdAt).toBeTruthy();

    // Verify it
    const result = verifyCrossChainIdentity(identity);
    expect(result.verified).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects an identity with wrong signature', () => {
    const keyPair1 = nacl.sign.keyPair();
    const keyPair2 = nacl.sign.keyPair();

    const identity = createCrossChainIdentity(
      keyPair1.secretKey,
      '0x' + 'd'.repeat(40),
      'base-sepolia',
    );

    // Tamper with the public key
    identity.casperPublicKey = encodeHex(keyPair2.publicKey);

    const result = verifyCrossChainIdentity(identity);
    expect(result.verified).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('Constants', () => {
  it('has correct network constant', () => {
    expect(NETWORK_CASPER_TESTNET).toBe('casper:casper-test');
  });

  it('has correct scheme constant', () => {
    expect(SCHEME_EXACT).toBe('exact');
  });
});
