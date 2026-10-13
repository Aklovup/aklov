import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateInquiry, inquiryLimits, inquiryServices } from '../src/lib/inquiry.ts';
import { createWeb3FormsPayload, submissionAccepted } from '../src/lib/web3forms.ts';
import { inquiryDelivery } from '../src/data/contact.ts';
const valid = { name: 'Ada Example', email: 'ada@example.com', service: 'Website', message: 'I would like to discuss a website.', botcheck: false };

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
test('enforces field limits', () => {
  for (const field of ['name', 'email', 'message']) {
    assert.ok(validateInquiry({ ...valid, [field]: 'x'.repeat(inquiryLimits[field] + 1) }).errors[field]);
  }
  assert.deepEqual(validateInquiry({ ...valid, name: 'x'.repeat(100), message: 'x'.repeat(5000) }).errors, {});
});
test('flags Web3Forms botcheck checkbox values', () => {
  for (const botcheck of [true, 'on', 'true']) assert.equal(validateInquiry({ ...valid, botcheck }).spam, true);
  for (const botcheck of [false, undefined, '']) assert.equal(validateInquiry({ ...valid, botcheck }).spam, false);
});
test('maps all fields, reply-to, subject, public key and captcha to the documented API payload', () => {
  const value = validateInquiry(valid).value;
  assert.deepEqual(createWeb3FormsPayload(value, 'isolated-test-token', inquiryDelivery), {
    access_key: inquiryDelivery.accessKey, subject: 'Aklov website inquiry', from_name: 'Aklov website',
    name: valid.name, email: valid.email, replyto: valid.email,
    project_category: 'Website', message: valid.message, botcheck: false,
    'h-captcha-response': 'isolated-test-token',
  });
});
test('optional category stays optional', () => {
  assert.equal(createWeb3FormsPayload(validateInquiry({ ...valid, service: '' }).value, 'test', inquiryDelivery).project_category, '');
});
test('requires HTTP success and a literal provider success boolean', () => {
  assert.equal(submissionAccepted({ ok: true }, { success: true }), true);
  for (const result of [null, {}, { success: false }, { success: 'true' }, { message: 'Email sent' }, 'true']) {
    assert.equal(submissionAccepted({ ok: true }, result), false);
  }
  assert.equal(submissionAccepted({ ok: false }, { success: true }), false);
});
