export const categoryIds = [
  'applications',
  'websites',
  'customer-systems',
  'automation',
  'integrations',
] as const;

export type ProjectCategory = (typeof categoryIds)[number];
export type ProjectFilter = ProjectCategory | 'all';

export const projectCategories: { id: ProjectCategory; label: string }[] = [
  { id: 'applications', label: 'Custom Business Applications' },
  { id: 'websites', label: 'Websites' },
  { id: 'customer-systems', label: 'Customer & Sales Systems' },
  { id: 'automation', label: 'Workflow Automation' },
  { id: 'integrations', label: 'Integrations & Reporting' },
];

export const categoryLabel = (id: ProjectCategory) =>
  projectCategories.find((category) => category.id === id)!.label;
