// Browser validation; Web3Forms performs its own server-side checks.
export const inquiryLimits = { name: 100, email: 254, message: 5000 } as const;
export const inquiryServices = [
  'Website', 'CRM & Sales Systems', 'Workflow Automation',
  'Custom Business Application', 'Integrations', 'Something Else',
] as const;
export type InquiryField = 'name' | 'email' | 'service' | 'message';
export type InquiryErrors = Partial<Record<InquiryField, string>>;
export type Inquiry = Record<InquiryField, string> & { botcheck: boolean };

export function validateInquiry(input: unknown): { value: Inquiry; errors: InquiryErrors; spam: boolean } {
  const record = input && typeof input === 'object' && !Array.isArray(input)
    ? input as Record<string, unknown> : {};
  const read = (key: string) => typeof record[key] === 'string' ? record[key].trim() : '';
  const value: Inquiry = { name: read('name'), email: read('email'), service: read('service'), message: read('message'), botcheck: record.botcheck === true || record.botcheck === 'on' || record.botcheck === 'true' };
  const errors: InquiryErrors = {};
  if (!value.name) errors.name = 'Please enter your name.';
  else if (value.name.length > inquiryLimits.name || /[\r\n\u0000]/.test(value.name)) errors.name = 'Please use a name of 100 characters or fewer.';
  if (!value.email) errors.email = 'Please enter your email address.';
  else if (value.email.length > inquiryLimits.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email) || /[\u0000]/.test(value.email)) errors.email = 'Please enter a valid email address.';
  if (value.service && !inquiryServices.some((service) => service === value.service)) errors.service = 'Please select one of the listed options.';
  if (!value.message) errors.message = 'Please tell me about your project.';
  else if (value.message.length > inquiryLimits.message || /\u0000/.test(value.message)) errors.message = 'Please use a message of 5,000 characters or fewer.';
  return { value, errors, spam: value.botcheck };
}
