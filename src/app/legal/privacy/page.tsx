import Link from "next/link";
import { LegalArticle, LegalSection } from "@/components/legal/LegalArticle";

export const metadata = {
  title: "Privacy policy — Lumiticket",
};

export default function PrivacyPage() {
  return (
    <LegalArticle title="Privacy policy" updated="12 September 2026">
      <LegalSection title="1. Information we collect">
        <ul className="list-disc space-y-1 pl-5">
          <li>Account details: name, email or mobile number, and country.</li>
          <li>Booking and transaction data: routes, seats, tickets, parcels, and payment status.</li>
          <li>Business verification (KYC/KYB) documents for operators, couriers, agents, and organizers.</li>
          <li>Device and validation data from the Scanning &amp; Validation and Driver apps, including offline scan logs.</li>
        </ul>
      </LegalSection>

      <LegalSection title="2. How we use it">
        <p>
          We use your information to process bookings and payments, issue and
          validate QR tickets, track parcels, send booking and delivery
          notifications by SMS or email, verify operator and agent
          eligibility, and produce settlement and reconciliation reports for
          operators.
        </p>
      </LegalSection>

      <LegalSection title="3. Payment data">
        <p>
          Payments are processed by licensed third-party payment gateways and
          mobile money providers. Lumiticket does not store raw payment card
          data, and does not hold customer funds directly — funds are split
          and settled by the gateway according to each operator&apos;s
          settlement rules.
        </p>
      </LegalSection>

      <LegalSection title="4. Who we share data with">
        <p>
          The operator, courier, agent, or organizer you book with receives
          the booking details necessary to deliver the service (for example,
          a passenger manifest shared with a driver, or a parcel handover
          confirmation with a courier). We do not sell personal data to third
          parties.
        </p>
      </LegalSection>

      <LegalSection title="5. Data retention">
        <p>
          Booking, payment, and validation records are retained for as long
          as needed for accounting, dispute resolution, and legal
          compliance, and are then deleted or anonymized. KYC/KYB
          verification records are retained for the duration of an
          operator&apos;s or agent&apos;s activity on the platform plus a
          reasonable retention period required for audit purposes.
        </p>
      </LegalSection>

      <LegalSection title="6. Security">
        <p>
          Customer and transaction data is encrypted in transit and at rest.
          Access to dashboards and administrative tools is governed by
          role-based access control enforced at the API level, and every
          staff account is individually attributable — shared logins are not
          permitted. Validation, payment, settlement, and access-control
          actions are logged for audit purposes.
        </p>
      </LegalSection>

      <LegalSection title="7. Your rights">
        <p>
          You can request a copy of the personal data we hold about you,
          ask us to correct inaccurate details, or request account deletion,
          subject to records we&apos;re required to retain for legal or
          accounting reasons. Contact us through our{" "}
          <Link href="/contact" className="font-medium text-navy-950 underline">
            contact page
          </Link>{" "}
          to make a request.
        </p>
      </LegalSection>

      <LegalSection title="8. Cookies and local storage">
        <p>
          The Lumiticket web app stores your session and recently issued QR
          tickets in your browser&apos;s local storage so they remain
          available offline. This data stays on your device and is not
          shared with third parties.
        </p>
      </LegalSection>

      <LegalSection title="9. Changes to this policy">
        <p>
          We may update this policy as the platform evolves. Material
          changes will be communicated in-app or by email before they take
          effect.
        </p>
      </LegalSection>
    </LegalArticle>
  );
}
