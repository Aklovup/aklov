import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateInquiry, inquiryLimits, inquiryServices } from '../src/lib/inquiry.ts';
const valid = { name: 'Ada Example', email: 'ada@example.com', service: 'Website', message: 'I would like to discuss a website.', website: '' };

test('normalizes fields and allows every approved service plus no selection', () => {
  for (const service of ['', ...inquiryServices]) {
    const result = validateInquiry({ ...valid, name: ' Ada Example ', service });
    assert.deepEqual(result.errors, {});
    assert.equal(result.value.name, 'Ada Example');
    assert.equal(result.spam, false);
  }
});
test('requires name, email and a non-whitespace message', () => {
  for (const value of [null, [], {}, { name: ' ', email: '', message: '\n' }]) {
    assert.deepEqual(Object.keys(validateInquiry(value).errors), ['name', 'email', 'message']);
  }
});
test('rejects invalid addresses, header injection, unsupported services and non-string values', () => {
  for (const email of ['invalid', 'a@b', 'a @b.com', 'a@b.com\r\nBcc:someone@example.com', { address: valid.email }]) {
    assert.ok(validateInquiry({ ...valid, email }).errors.email);
  }
  assert.ok(validateInquiry({ ...valid, name: 'Ada\r\nInjected' }).errors.name);
  assert.ok(validateInquiry({ ...valid, service: 'Invented service' }).errors.service);
  assert.ok(validateInquiry({ ...valid, message: { text: 'hi' } }).errors.message);
});
test('enforces the same field limits for browser and future server use', () => {
  for (const field of ['name', 'email', 'message']) {
    assert.ok(validateInquiry({ ...valid, [field]: 'x'.repeat(inquiryLimits[field] + 1) }).errors[field]);
  }
  assert.deepEqual(validateInquiry({ ...valid, name: 'x'.repeat(100), message: 'x'.repeat(5000) }).errors, {});
});
test('flags the honeypot without fabricating a successful submission', () => {
  assert.equal(validateInquiry({ ...valid, website: 'https://spam.example' }).spam, true);
});
