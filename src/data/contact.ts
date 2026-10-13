export const contact = {
  metadata: {
    title: 'Contact Aklov | Loveth Akpochimora',
    description: "Get in touch with Loveth Akpochimora about websites, CRM, workflow automation, custom business applications, and integrations.",
  },
  name: 'Loveth Akpochimora',
  email: 'aklovup@gmail.com',
  eyebrow: 'CONTACT',
  headline: "Let's talk about what you're working on.",
  introduction: [
    "Whether you have a project in mind, an existing system that needs improvement, or a business process you're trying to figure out, I'd be interested in hearing about it.",
    "Tell me a little about what you're working on and what you'd like to achieve. We can take it from there.",
  ],
  formHeading: 'Tell me about your project',
  submitLabel: 'Send inquiry',
  success: {
    heading: 'Your message has been sent.',
    body: "Thanks for reaching out. I'll get back to you as soon as I can.",
  },
  failure: {
    heading: "Your message couldn't be sent.",
    body: 'Please try again or contact me directly at aklovup@gmail.com.',
  },
  direct: {
    heading: 'Prefer to reach out directly?',
    body: 'You can send me an email or connect with me on LinkedIn.',
    linkedinLabel: 'Connect on LinkedIn',
  },
  closing: "Good projects usually begin with a conversation. You don't need to have everything figured out before getting in touch.",
};

// Enable only after a deployed handler has passed a real delivery test.
export const inquiryDelivery = {
  enabled: false,
  endpoint: '/api/contact',
  unavailableMessage: 'Online inquiries are not available yet. Please contact me directly by email.',
};
