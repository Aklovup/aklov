import { validateInquiry, type InquiryField } from '../lib/inquiry';
import { createWeb3FormsPayload, submissionAccepted } from '../lib/web3forms';

type CaptchaWindow = Window & {
  aklovCaptchaVerified?: () => void;
  aklovCaptchaExpired?: () => void;
  aklovCaptchaError?: () => void;
  hcaptcha?: { reset: () => void };
};
const captchaWindow = window as CaptchaWindow;
const form = document.querySelector<HTMLFormElement>('[data-inquiry-form]');
if (form) {
  const panel = form.closest<HTMLElement>('[data-contact-panel]')!;
  const fieldsRegion = form.querySelector<HTMLElement>('[data-inquiry-fields]')!;
  const submit = form.querySelector<HTMLButtonElement>('[type="submit"]')!;
  const feedback = form.querySelector<HTMLElement>('[data-feedback]')!;
  const success = form.querySelector<HTMLElement>('[data-success]')!;
  const failure = form.querySelector<HTMLElement>('[data-failure]')!;
  const loading = form.querySelector<HTMLElement>('[data-loading]')!;
  const captchaError = form.querySelector<HTMLElement>('[data-captcha-error]')!;
  const fields = ['name', 'email', 'service', 'message'] as InquiryField[];
  const configuration = {
    accessKey: (form.elements.namedItem('access_key') as HTMLInputElement).value,
    subject: (form.elements.namedItem('subject') as HTMLInputElement).value,
    fromName: (form.elements.namedItem('from_name') as HTMLInputElement).value,
  };
  let processing = false;
  let sent = false;
  form.noValidate = true;
  const validate = () => validateInquiry(Object.fromEntries(new FormData(form)));
  const updateSubmit = () => { submit.disabled = processing || sent || Object.keys(validate().errors).length > 0; };
  const captchaToken = () => String(new FormData(form).get('h-captcha-response') ?? '').trim();
  const clearError = (field: InquiryField) => {
    const control = form.elements.namedItem(field) as HTMLInputElement;
    control.removeAttribute('aria-invalid');
    form.querySelector<HTMLElement>(`[data-error="${field}"]`)!.textContent = '';
  };
  for (const field of fields) {
    const control = form.elements.namedItem(field) as HTMLInputElement;
    const onChange = () => { clearError(field); updateSubmit(); };
    control.addEventListener('input', onChange);
    control.addEventListener('change', onChange);
  }
  // Validate on blur so missing/invalid fields remain explainable while Send is disabled.
  fields.forEach((field) => {
    const control = form.elements.namedItem(field) as HTMLInputElement;
    control.addEventListener('blur', () => {
      const error = validate().errors[field];
      if (!error) return;
      control.setAttribute('aria-invalid', 'true');
      form.querySelector<HTMLElement>(`[data-error="${field}"]`)!.textContent = error;
    });
  });
  captchaWindow.aklovCaptchaVerified = () => { captchaError.textContent = ''; };
  captchaWindow.aklovCaptchaExpired = () => { captchaError.textContent = 'The spam check expired. Please complete it again.'; };
  captchaWindow.aklovCaptchaError = () => { captchaError.textContent = 'The spam check could not load. Please reload the page or contact me directly by email.'; };
  // Load the provider's free hCaptcha integration only on the Contact page,
  // after the callbacks are registered. Reserve widget space in the component.
  const captchaScript = document.createElement('script');
  captchaScript.src = 'https://web3forms.com/client/script.js';
  captchaScript.async = true;
  captchaScript.onerror = captchaWindow.aklovCaptchaError;
  document.body.append(captchaScript);
  updateSubmit();

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (processing || sent) return;
    const { value, errors, spam } = validate();
    fields.forEach(clearError);
    feedback.hidden = true;
    success.hidden = true;
    failure.hidden = true;
    if (Object.keys(errors).length) {
      fields.forEach((field) => {
        if (!errors[field]) return;
        const control = form.elements.namedItem(field) as HTMLInputElement;
        control.setAttribute('aria-invalid', 'true');
        form.querySelector<HTMLElement>(`[data-error="${field}"]`)!.textContent = errors[field]!;
      });
      (form.elements.namedItem(fields.find((field) => errors[field])!) as HTMLElement).focus();
      updateSubmit();
      return;
    }
    const token = captchaToken();
    if (!token && !spam) {
      captchaError.textContent = 'Please complete the spam check before sending your inquiry.';
      captchaError.focus();
      return;
    }
    processing = true;
    updateSubmit();
    form.setAttribute('aria-busy', 'true');
    loading.hidden = false;
    try {
      if (spam) throw new Error('Submission rejected.');
      const response = await fetch(form.action, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(createWeb3FormsPayload(value, token, configuration)),
        signal: AbortSignal.timeout(20000),
      });
      const result: unknown = await response.json();
      if (!submissionAccepted(response, result)) throw new Error('Submission not accepted.');
      sent = true;
      success.hidden = false;
      form.reset();
      fieldsRegion.hidden = true;
      panel.classList.add('is-sent');
      const successHeading = success.querySelector<HTMLElement>('h3')!;
      panel.querySelector<HTMLElement>('#inquiry-title')!.textContent = successHeading.textContent;
      successHeading.hidden = true;
      feedback.setAttribute('aria-labelledby', 'inquiry-title');
    } catch {
      failure.hidden = false;
    } finally {
      processing = false;
      form.removeAttribute('aria-busy');
      loading.hidden = true;
      // Each attempted API submission consumes its captcha token; retain entered copy
      // after failures, but require a fresh challenge before trying again.
      captchaWindow.hcaptcha?.reset();
      captchaError.textContent = '';
      updateSubmit();
      feedback.hidden = false;
      feedback.focus();
    }
  });
}
