import type { ImageMetadata } from 'astro';

export const profile = {
  name: 'Loveth Akpochimora',
  designation: 'Business Systems & Automation Specialist',
  portrait: {
    // Add an imported local image or approved remote URL here.
    src: undefined as ImageMetadata | string | undefined,
    alt: 'Portrait of Loveth Akpochimora',
    width: 1200,
    height: 1500,
  },
};

export const about = {
  metadata: {
    title: 'About Aklov | Loveth Akpochimora',
    description: 'Meet Loveth Akpochimora, the professional behind Aklov. Learn about my approach to websites, business systems, CRM, automation, and custom applications.',
  },
  introduction: {
    eyebrow: 'ABOUT AKLOV',
    headline: 'Better systems begin with understanding the business.',
    paragraphs: [
      'Every business has its own way of working.',
      'Some processes are straightforward. Others involve several people, different tools, and a lot of information moving from one place to another.',
      'And as a business grows, the things that used to work can start getting in the way.',
      "That's the kind of work I enjoy getting into: understanding how things currently operate, finding where the gaps are, and building practical solutions that make the work easier to manage.",
      "I'm Loveth Akpochimora, the person behind Aklov. I work with businesses to improve their websites, customer management, sales processes, and day-to-day operations through thoughtful system design and technology.",
    ],
  },
  biography: {
    heading: 'A little about me',
    paragraphs: [
      'My background is in Mechanical Engineering, but over time, my work has taken me deeper into business systems, software, and automation.',
      'What interests me about both fields is the thinking behind how things work.',
      "When something isn't working as expected, I want to understand why. How is the process supposed to work? Where does information come from? What happens next? And what needs to change for everything to work together?",
      'That curiosity has shaped the kind of projects I take on.',
      "I've worked on customer management systems, custom business applications, e-commerce websites, integrations, and AI-powered workflows.",
      'Some projects involve building something from the ground up. Others involve working with systems a business already uses and making them better suited to its operations.',
      'The technology changes from project to project, but the starting point stays the same: understanding what the business needs to accomplish.',
    ],
  },
  approach: {
    heading: 'How I approach the work',
    paragraphs: [
      'I believe the quality of a solution depends heavily on how well the problem is understood.',
      "It's easy to recommend a new tool, add another automation, or build a feature because it sounds useful.",
      "But before doing any of that, I prefer to understand what's already happening.",
      'Where does a customer inquiry go after it comes in? Who is responsible for the next step? What information do they need? What happens when something is delayed, missed, or handed over to someone else?',
      'Those details matter.',
      'They help determine whether a business needs a better process, a change to its existing system, an integration, or something built specifically for the way it operates.',
    ],
    sequenceIntroduction: 'My approach generally follows four stages:',
    stages: [
      { number: '01', title: 'Understand', description: 'I start by learning about the business, its existing processes, the people involved, and the problem that needs solving.' },
      { number: '02', title: 'Design', description: 'I work out how the solution should function, including the flow of information, responsibilities, and connections between systems.' },
      { number: '03', title: 'Build', description: 'I implement the solution, whether that involves a website, CRM, automation, integration, or custom application.' },
      { number: '04', title: 'Refine', description: 'I test how the different parts work together, address issues, and make adjustments so the solution is practical to use.' },
    ],
    closing: 'The goal is to build something that makes sense for the people who will actually use it.',
  },
  work: {
    heading: "The work I've done",
    paragraphs: [
      'My experience covers several areas of business technology, often with more than one coming together in the same project.',
      "I've built custom applications that bring ordering, inventory, quality control, and financial processes into connected workflows.",
      "I've developed and customized commerce websites, including shopping experiences that accommodate different brands, customer-access requirements, and product catalogs.",
      "I've worked on CRM systems designed around how businesses manage leads, customers, bookings, and operational activities.",
      "And I've built AI-powered workflows that connect conversations with business information, scheduling tools, and other applications.",
      'These projects have given me experience working with different requirements, business models, and technical constraints.',
      "They've also reinforced something I consider important: a solution can be technically impressive and still be difficult to use if it doesn't fit the way people work.",
      "That's why I pay attention to both the technical implementation and the process behind it.",
    ],
    cta: 'Explore selected projects →',
  },
  together: {
    heading: 'Working together',
    paragraphs: [
      "I like projects where there's a real problem to understand and something useful to build.",
      "You might already know exactly what you need. You might have several disconnected tools, a process that depends too much on manual work, or an idea you're still trying to figure out.",
      "Either way, the conversation starts with understanding what you're trying to achieve.",
      'From there, we can work out what makes sense, what needs to be built, and how the different pieces should come together.',
      "I'm comfortable working with existing systems, building new ones, and connecting tools where necessary.",
      'And I believe communication should be clear throughout the process, especially when the work involves complex requirements or several moving parts.',
    ],
  },
  closing: {
    headline: "Have something you're trying to improve?",
    paragraph: "Whether it's a website, a customer management process, an operational workflow, or a custom business application, I'd be interested in hearing what you're working on.",
    primaryCta: "Let's talk about your project →",
    secondaryCta: 'View my work →',
  },
};
