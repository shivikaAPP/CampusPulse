import { Seo } from '../seo/Seo.js';
import { STATIC_PAGES } from '../seo/pages.js';

export function Terms() {
  const contactEmail = import.meta.env.VITE_CONTACT_EMAIL || 'contact@campusplus.in';

  return (
    <div className="container prose" style={{ padding: 'var(--space-8) var(--gutter) var(--space-16)' }}>
      <Seo
        title={STATIC_PAGES.terms.title}
        description={STATIC_PAGES.terms.description}
        path={STATIC_PAGES.terms.path}
        noindex={STATIC_PAGES.terms.noindex}
      />

      <h1>{STATIC_PAGES.terms.h1}</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
        Last updated: 24 October 2026
      </p>

      <h2>1. Who we are and what CampusPlus does</h2>
      <p>
        CampusPlus is a student discovery and application tracking directory. CampusPlus is not an
        event organizer, employer, educational institution, or official registration portal. We
        aggregate information about hackathons, internships, workshops, and competitions to help
        college students discover relevant opportunities.
      </p>

      <h2>2. Third party listings</h2>
      <p>
        Listings displayed on CampusPlus come from external organizers, public announcements, and
        community submissions. CampusPlus does not organize, sponsor, or run these events, does not
        conduct hiring for listed roles, and does not endorse any third party opportunity.
      </p>

      <h2>3. Verify before you act</h2>
      <p>
        Students must independently confirm all dates, deadlines, registration fees, venue details,
        and requirements on the official organizer page before registering or paying fees. Fees
        listed on CampusPlus represent registration fees only. Additional expenses such as travel,
        lodging, food, and equipment are not included and remain the sole responsibility of the
        student.
      </p>

      <h2>4. Match score and eligibility checker</h2>
      <p>
        The match score and eligibility calculations are automated informational estimates based
        solely on the information you enter in your browser and data fields present in listings. A
        high match score does not guarantee eligibility, acceptance, interview invitation, or award.
        You must review official guidelines to verify whether you qualify.
      </p>

      <h2>5. Application tracking</h2>
      <p>
        Application statuses (Interested, Applied, Shortlisted, Completed) and checklist items are
        updated solely by you. CampusPlus does not receive confirmation or updates from employers or
        organizers. All tracking data is stored locally in your browser storage.
      </p>

      <h2>6. Demo data</h2>
      <p>
        Records marked with the "Demo data" badge are fictitious samples created to test and demonstrate
        application features. They do not represent real opportunities, organizations, or links.
      </p>

      <h2>7. Verification labels</h2>
      <p>
        Verification badges indicate the review state of a listing:
      </p>
      <ul>
        <li>
          <strong>Verified:</strong> Details and link have been verified against an official source by
          a moderator.
        </li>
        <li>
          <strong>Community reported:</strong> Submitted by a community member and pending moderator review.
        </li>
        <li>
          <strong>Unverified:</strong> Sourced automatically or sample data not yet confirmed by our team.
        </li>
        <li>
          <strong>Expired:</strong> The registration deadline has passed.
        </li>
      </ul>

      <h2>8. Submissions and reports</h2>
      <p>
        Users who submit opportunities or report listings agree to provide accurate, lawful, and
        truthful information. CampusPlus moderators reserve the right to edit, decline, or remove any
        submission or listing at any time without prior notice.
      </p>

      <h2>9. Acceptable use</h2>
      <p>
        You agree to use CampusPlus only for personal, non-commercial opportunity discovery. You must
        not scrape the site in violation of applicable laws, submit spam, upload malicious content, or
        attempt to disrupt server infrastructure.
      </p>

      <h2>10. Intellectual property</h2>
      <p>
        The CampusPlus name, logo, interface design, code, and database schema belong to the project
        maintainers. Third party listing names, trademarks, and organizer marks belong to their
        respective owners.
      </p>

      <h2>11. Availability and changes</h2>
      <p>
        CampusPlus is provided on an "as is" and "as available" basis without warranties of any kind.
        Features may be modified, suspended, or discontinued at any time. These Terms may be updated
        periodically, and the "Last updated" date will reflect the latest revision.
      </p>

      <h2>12. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by applicable law, CampusPlus and its maintainers are not
        liable for missed deadlines, rejected applications, incorrect listing information, event
        cancellations, or financial losses arising from third party events.
      </p>

      <h2>13. Governing law</h2>
      <p>
        These Terms are governed by and construed in accordance with the laws of India. Any legal
        proceedings shall be subject to the exclusive jurisdiction of the competent courts in India.
      </p>

      <h2>14. Contact</h2>
      <p>
        For inquiries regarding these Terms and Conditions, please contact us by email at{' '}
        <a href={`mailto:${contactEmail}`} style={{ color: 'var(--accent)' }}>
          {contactEmail}
        </a>
        .
      </p>
    </div>
  );
}
export default Terms;
