import { Link } from 'react-router-dom';
import { Seo } from '../seo/Seo.js';
import { STATIC_PAGES } from '../seo/pages.js';

export function Privacy() {
  const contactEmail = import.meta.env.VITE_CONTACT_EMAIL || 'contact@campusplus.in';

  return (
    <div className="container prose" style={{ padding: 'var(--space-8) var(--gutter) var(--space-16)' }}>
      <Seo
        title={STATIC_PAGES.privacy.title}
        description={STATIC_PAGES.privacy.description}
        path={STATIC_PAGES.privacy.path}
        noindex={STATIC_PAGES.privacy.noindex}
      />

      <h1>{STATIC_PAGES.privacy.h1}</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
        Last updated: 24 October 2026
      </p>

      <h2>1. Overview and summary</h2>
      <p>
        CampusPlus is designed with privacy by default. We do not require account creation, we do
        not display third party advertisements, and we do not use tracking cookies on visitor
        browsers.
      </p>

      <h2>2. Data stored only in your browser</h2>
      <p>
        The following information is stored strictly on your local device using browser local
        storage:
      </p>
      <ul>
        <li>
          <strong>Profile:</strong> display name, college, city, year of study, skills, interests,
          experience level, preferred mode, and maximum budget.
        </li>
        <li>
          <strong>Saved listings:</strong> identifiers of opportunities you bookmark.
        </li>
        <li>
          <strong>Application statuses:</strong> your self-reported statuses (Interested, Applied,
          Shortlisted, Completed).
        </li>
        <li>
          <strong>Preparation checklists:</strong> checkboxes you complete for each listing.
        </li>
      </ul>
      <p>
        This personal data never leaves your device and is never sent to CampusPlus servers. You can
        inspect or remove this data at any time by clearing your browser cache or using the{' '}
        <Link to="/profile" style={{ color: 'var(--accent)' }}>
          "Delete my data on this device" button on your profile page
        </Link>
        .
      </p>

      <h2>3. Data sent to our servers</h2>
      <p>
        We only receive data that you explicitly submit through forms:
      </p>
      <ul>
        <li>
          <strong>Listing reports:</strong> listing identifier, selected reason, optional details note
          (up to 500 characters), and optional contact email.
        </li>
        <li>
          <strong>Opportunity submissions:</strong> event details and optional submitter email.
        </li>
        <li>
          <strong>Technical request data:</strong> incoming network requests include standard IP
          addresses and user-agent headers processed in real time by our hosting provider for rate
          limiting and DDoS defense. Our application database does not store student IP addresses.
        </li>
      </ul>

      <h2>4. Cookies</h2>
      <p>
        Ordinary visitors receive zero cookies from CampusPlus. A secure, httpOnly session cookie is
        used exclusively for authenticated administrators accessing the moderation panel at
        <code>/admin</code>.
      </p>

      <h2>5. Purpose of processing</h2>
      <p>
        We process information to present accurate opportunities, review community reports, evaluate
        event submissions, and maintain the operational security of our services.
      </p>

      <h2>6. Data sharing</h2>
      <p>
        We never sell, rent, or monetize student data. Data submitted via reports or forms is shared
        only with infrastructure providers acting strictly on our instructions to host our website
        and database.
      </p>

      <h2>7. Data retention</h2>
      <p>
        Reports and submissions are retained until reviewed by moderators and archived for a period
        of up to 12 months for record keeping, after which they are permanently deleted.
      </p>

      <h2>8. Analytics</h2>
      <p>
        CampusPlus does not employ third party analytics trackers, pixel tags, or user session
        recording scripts.
      </p>

      <h2>9. Your rights and grievance officer</h2>
      <p>
        In accordance with applicable law, including India's Digital Personal Data Protection Act,
        2023, you have the right to request access, correction, or erasure of any personal data you
        have directly submitted to our servers (such as email addresses in reports). To exercise
        these rights or raise a grievance, contact our Grievance Officer at{' '}
        <a href={`mailto:${contactEmail}`} style={{ color: 'var(--accent)' }}>
          {contactEmail}
        </a>
        .
      </p>

      <h2>10. Age limitation</h2>
      <p>
        CampusPlus is designed for college and university students. We do not knowingly collect
        personal data from individuals under 18 years of age.
      </p>

      <h2>11. External websites</h2>
      <p>
        Our listings link to third party organizer and application websites. When you leave
        CampusPlus, your browsing is subject to the privacy policies and practices of those external
        sites.
      </p>

      <h2>12. Contact</h2>
      <p>
        If you have questions or feedback regarding this Privacy Policy, please email us at{' '}
        <a href={`mailto:${contactEmail}`} style={{ color: 'var(--accent)' }}>
          {contactEmail}
        </a>
        .
      </p>
    </div>
  );
}
export default Privacy;
