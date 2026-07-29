import test from 'node:test';
import assert from 'node:assert/strict';
import {
  consumeSuiteLogin,
  exchangeSuiteCode,
  removeSuiteCodeFromUrl,
} from './zeroSlateApi.js';

test('exchangeSuiteCode posts suite code and returns the exchange payload', async () => {
  const calls = [];

  const payload = await exchangeSuiteCode('suite-123', {
    fetchImpl: async (url, options) => {
      calls.push([url, options]);
      return {
        ok: true,
        json: async () => ({
          token_hash: 'otp-hash',
          type: 'magiclink',
          user: { email: 'suite@zeroslate.kr' },
        }),
      };
    },
  });

  assert.deepEqual(payload, {
    token_hash: 'otp-hash',
    type: 'magiclink',
    user: { email: 'suite@zeroslate.kr' },
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], 'https://zeroslate.kr/api/auth/suite/exchange');
  assert.deepEqual(calls[0][1], {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: 'suite-123' }),
  });
});

test('consumeSuiteLogin strips suiteCode and verifies otp', async () => {
  const replacedUrls = [];
  const verifyCalls = [];

  const didConsume = await consumeSuiteLogin({
    suiteCode: 'suite-otp',
    locationHref: 'https://log.zeroslate.kr/?suiteCode=suite-otp&returnUrl=https%3A%2F%2Fzeroslate.kr%2Fapp',
    replaceUrl: (nextUrl) => replacedUrls.push(nextUrl),
    supabaseAuth: {
      verifyOtp: async (payload) => {
        verifyCalls.push(payload);
        return { error: null };
      },
    },
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({
        token_hash: 'otp-hash',
        type: 'magiclink',
        user: { email: 'suite@zeroslate.kr' },
      }),
    }),
  });

  assert.equal(didConsume, true);
  assert.deepEqual(replacedUrls, [
    'https://log.zeroslate.kr/?returnUrl=https%3A%2F%2Fzeroslate.kr%2Fapp',
  ]);
  assert.deepEqual(verifyCalls, [{
    token_hash: 'otp-hash',
    type: 'magiclink',
  }]);
});

test('removeSuiteCodeFromUrl only removes suiteCode', () => {
  assert.equal(
    removeSuiteCodeFromUrl('https://log.zeroslate.kr/?suiteCode=once&date=2026-07-29&preview=mobile'),
    'https://log.zeroslate.kr/?date=2026-07-29&preview=mobile',
  );
});

test('consumeSuiteLogin strips suiteCode even when exchange fails', async () => {
  const replacedUrls = [];

  await assert.rejects(() => consumeSuiteLogin({
    suiteCode: 'expired-code',
    locationHref: 'https://log.zeroslate.kr/?suiteCode=expired-code&from=zeroslate',
    replaceUrl: (nextUrl) => replacedUrls.push(nextUrl),
    supabaseAuth: { verifyOtp: async () => ({ error: null }) },
    fetchImpl: async () => ({
      ok: false,
      json: async () => ({ error: 'invalid_code' }),
    }),
  }));

  assert.deepEqual(replacedUrls, [
    'https://log.zeroslate.kr/?from=zeroslate',
  ]);
});
