export const categoryIds = [
  'websites',
  'customer-systems',
  'automation',
  'applications',
  'integrations',
] as const;

export type ProjectCategory = (typeof categoryIds)[number];
export type ProjectFilter = ProjectCategory | 'all';

export const projectCategories: { id: ProjectCategory; label: string }[] = [
  { id: 'websites', label: 'Websites' },
  { id: 'customer-systems', label: 'Customer & Sales Systems' },
  { id: 'automation', label: 'Workflow Automation' },
  { id: 'applications', label: 'Custom Business Applications' },
  { id: 'integrations', label: 'Integrations & Reporting' },
];

export const categoryLabel = (id: ProjectCategory) =>
  projectCategories.find((category) => category.id === id)!.label;
