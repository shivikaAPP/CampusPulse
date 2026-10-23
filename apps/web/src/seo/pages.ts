export interface PageMetadata {
  path: string;
  title: string;
  description: string;
  h1: string;
  noindex?: boolean;
}

export const STATIC_PAGES: Record<string, PageMetadata> = {
  home: {
    path: '/',
    title: 'CampusPlus | Free student hackathons, internships, workshops',
    description: 'Search hackathons, internships, workshops and competitions in one list. Filter by fee, city and deadline, check eligibility and track your applications.',
    h1: 'Free hackathons, internships and workshops for college students',
    noindex: false,
  },
  explore: {
    path: '/explore',
    title: 'Explore student opportunities | CampusPlus',
    description: 'Browse hackathons, internships, workshops, competitions and meetups. Combine filters for fee, mode, skill, level, city and deadline.',
    h1: 'Explore opportunities',
    noindex: false,
  },
  saved: {
    path: '/saved',
    title: 'Saved opportunities | CampusPlus',
    description: 'Your saved hackathons, internships and workshops on this device, with deadline labels and a link back to each listing.',
    h1: 'Saved opportunities',
    noindex: true,
  },
  applications: {
    path: '/applications',
    title: 'Application tracker | CampusPlus',
    description: 'Track the status of each opportunity you applied to, update it yourself and finish the preparation checklist for every listing.',
    h1: 'Application tracker',
    noindex: true,
  },
  profile: {
    path: '/profile',
    title: 'Your profile | CampusPlus',
    description: 'Set your skills, interests, budget and city so CampusPlus can calculate match scores. Your profile stays in this browser.',
    h1: 'Your profile',
    noindex: true,
  },
  submit: {
    path: '/submit',
    title: 'Submit an opportunity | CampusPlus',
    description: 'Submit a hackathon, internship or workshop for review. Include the official source link so moderators can verify it.',
    h1: 'Submit an opportunity',
    noindex: false,
  },
  terms: {
    path: '/terms',
    title: 'Terms and Conditions | CampusPlus',
    description: 'The terms for using CampusPlus, including how listings, match scores and application tracking work and what we do not guarantee.',
    h1: 'Terms and Conditions',
    noindex: false,
  },
  privacy: {
    path: '/privacy',
    title: 'Privacy Policy | CampusPlus',
    description: 'What data CampusPlus stores, where it is stored, how reports and submissions are handled and how to contact us about your data.',
    h1: 'Privacy Policy',
    noindex: false,
  },
  admin: {
    path: '/admin',
    title: 'Admin | CampusPlus',
    description: 'Moderation tools for CampusPlus listings, reports and submissions. Review incoming submissions and manage verification records.',
    h1: 'Moderation',
    noindex: true,
  },
  loading: {
    path: '/loading',
    title: 'Loading CampusPlus | Opportunities and tracker',
    description: 'Loading your opportunities, personalized match scores, and application checklists. Please wait while the dashboard initializes your session.',
    h1: 'Loading your opportunities',
    noindex: true,
  },
  login: {
    path: '/login',
    title: 'Student Login | CampusPlus',
    description: 'Log in to your CampusPlus student account using your college email address. Access your saved opportunities, match scores, and application tracker.',
    h1: 'Student account login',
    noindex: true,
  },
  notFound: {
    path: '/404',
    title: 'Page not found | CampusPlus',
    description: 'The page you requested does not exist on CampusPlus. Return to the home page or browse all available opportunities.',
    h1: 'Page not found',
    noindex: true,
  },
};
