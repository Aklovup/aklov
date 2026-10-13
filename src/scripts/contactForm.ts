import { validateInquiry, type InquiryField } from '../lib/inquiry';

const form = document.querySelector<HTMLFormElement>('[data-inquiry-form]');
if (form) {
  const submit = form.querySelector<HTMLButtonElement>('[type="submit"]')!;
  const feedback = form.querySelector<HTMLElement>('[data-feedback]')!;
  const success = form.querySelector<HTMLElement>('[data-success]')!;
  const failure = form.querySelector<HTMLElement>('[data-failure]')!;
  const loading = form.querySelector<HTMLElement>('[data-loading]')!;
  const available = form.dataset.deliveryEnabled === 'true';
  let processing = false;
  let sent = false;
  submit.disabled = !available;
  form.noValidate = true;

  const clearError = (field: InquiryField) => {
    const control = form.elements.namedItem(field) as HTMLInputElement;
    control.removeAttribute('aria-invalid');
    form.querySelector<HTMLElement>(`[data-error="${field}"]`)!.textContent = '';
  };
  for (const field of ['name', 'email', 'service', 'message'] as InquiryField[]) {
    const control = form.elements.namedItem(field) as HTMLInputElement;
    control.addEventListener('input', () => clearError(field));
  }
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!available || processing || sent) return;
    const { value, errors, spam } = validateInquiry(Object.fromEntries(new FormData(form)));
    const fields = ['name', 'email', 'service', 'message'] as InquiryField[];
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
      const first = fields.find((field) => errors[field])!;
      (form.elements.namedItem(first) as HTMLElement).focus();
      return;
    }
    processing = true;
    submit.disabled = true;
    form.setAttribute('aria-busy', 'true');
    loading.hidden = false;
    try {
      if (spam) throw new Error('Submission rejected.');
      const response = await fetch(form.action, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(value), signal: AbortSignal.timeout(20000),
      });
      const result = await response.json();
      if (!response.ok || result?.success !== true) throw new Error('Delivery not confirmed.');
      sent = true;
      success.hidden = false;
      form.reset();
    } catch {
      failure.hidden = false;
    } finally {
      processing = false;
      submit.disabled = sent;
      form.removeAttribute('aria-busy');
      loading.hidden = true;
      feedback.hidden = false;
      feedback.focus();
    }
  });
}
