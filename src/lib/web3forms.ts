import type { Inquiry } from './inquiry';

export function createWeb3FormsPayload(
  inquiry: Inquiry,
  captchaToken: string,
  configuration: { accessKey: string; subject: string; fromName: string },
) {
  return {
    access_key: configuration.accessKey,
    subject: configuration.subject,
    from_name: configuration.fromName,
    name: inquiry.name,
    email: inquiry.email,
    replyto: inquiry.email,
    project_category: inquiry.service,
    message: inquiry.message,
    botcheck: inquiry.botcheck,
    'h-captcha-response': captchaToken,
  };
}

// A 2xx alone, a string "true", or a returned message is not acceptance.
export function submissionAccepted(response: { ok: boolean }, result: unknown): boolean {
  return response.ok && Boolean(result && typeof result === 'object' && 'success' in result && result.success === true);
}
