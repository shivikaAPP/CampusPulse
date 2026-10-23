export interface VocabItem {
  slug: string;
  label: string;
}

export const SKILLS: VocabItem[] = [
  { slug: 'python', label: 'Python' },
  { slug: 'java', label: 'Java' },
  { slug: 'javascript', label: 'JavaScript' },
  { slug: 'html-css', label: 'HTML/CSS' },
  { slug: 'react', label: 'React' },
  { slug: 'web-development', label: 'Web Development' },
  { slug: 'ai-ml', label: 'AI/ML' },
  { slug: 'data-analysis', label: 'Data Analysis' },
  { slug: 'sql', label: 'SQL' },
  { slug: 'git', label: 'Git' },
  { slug: 'cloud', label: 'Cloud' },
  { slug: 'cybersecurity', label: 'Cybersecurity' },
];

export const TOPICS: VocabItem[] = [
  { slug: 'ai-ml', label: 'AI/ML' },
  { slug: 'web-development', label: 'Web Development' },
  { slug: 'cybersecurity', label: 'Cybersecurity' },
  { slug: 'cloud', label: 'Cloud' },
  { slug: 'data-science', label: 'Data Science' },
  { slug: 'open-source', label: 'Open Source' },
  { slug: 'product', label: 'Product' },
];

export const CATEGORIES: VocabItem[] = [
  { slug: 'hackathon', label: 'Hackathon' },
  { slug: 'internship', label: 'Internship' },
  { slug: 'workshop', label: 'Workshop' },
  { slug: 'competition', label: 'Competition' },
  { slug: 'meetup', label: 'Meetup' },
];

export const SKILL_LABELS: Record<string, string> = Object.fromEntries(
  SKILLS.map((item) => [item.slug, item.label])
);

export const TOPIC_LABELS: Record<string, string> = Object.fromEntries(
  TOPICS.map((item) => [item.slug, item.label])
);

export const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((item) => [item.slug, item.label])
);
