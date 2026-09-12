import Link from "next/link";
import { LegalArticle, LegalSection } from "@/components/legal/LegalArticle";

export const metadata = {
  title: "Refunds & cancellations — Lumiticket",
};

export default function RefundsPage() {
  return (
    <LegalArticle title="Refunds &amp; cancellations" updated="12 September 2026">
      <LegalSection title="How refunds work">
        <p>
          Cancellation and refund terms are set by the operator or organizer
          for each specific trip or event, and are always shown before you
          pay — Lumiticket enforces whatever policy they&apos;ve set rather
          than a single platform-wide rule.
        </p>
      </LegalSection>

      <LegalSection title="Bus tickets">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Selecting a seat holds it for a limited time (5 minutes by
            default). If payment isn&apos;t confirmed in time, the seat is
            released automatically — no charge is made, so there&apos;s
            nothing to refund.
          </li>
          <li>
            Once paid, cancellation eligibility and any fee depend on the
            operator&apos;s policy for that route, shown at checkout.
          </li>
          <li>
            To cancel a paid booking, go to{" "}
            <Link href="/bookings" className="font-medium text-navy-950 underline">
              Manage my bookings
            </Link>{" "}
            or contact us with your booking reference.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Event tickets">
        <p>
          Refund and cancellation terms are set by the event organizer and
          shown on the event page before you buy. If an organizer cancels or
          postpones an event, affected ticket holders are notified and
          refunded or offered a rescheduled ticket according to that
          organizer&apos;s policy.
        </p>
      </LegalSection>

      <LegalSection title="Parcels">
        <p>
          A parcel can be cancelled before it&apos;s collected by the
          courier. Once a parcel is in transit, standard courier liability
          terms apply — see your courier&apos;s agreement for lost, damaged,
          or delayed parcels, and Goods-in-Transit insurance coverage above a
          declared value threshold.
        </p>
      </LegalSection>

      <LegalSection title="When a payment succeeds but a booking doesn't">
        <p>
          If a payment gateway confirms your payment but the corresponding
          booking or ticket fails to complete on our end, this mismatch is
          detected automatically during reconciliation, and either your
          booking is completed or an automatic refund is triggered — the
          incident is also logged for review.
        </p>
      </LegalSection>

      <LegalSection title="How long a refund takes">
        <p>
          Refunds are returned to your original payment method. Card refunds
          typically take 5–10 business days to reflect, depending on your
          bank; mobile money refunds are usually faster, often within 24–48
          hours.
        </p>
      </LegalSection>

      <LegalSection title="How to request one">
        <p>
          Go to{" "}
          <Link href="/bookings" className="font-medium text-navy-950 underline">
            Manage my bookings
          </Link>
          , or{" "}
          <Link href="/contact" className="font-medium text-navy-950 underline">
            contact us
          </Link>{" "}
          with your booking or tracking reference and we&apos;ll follow up
          with the operator, organizer, or courier on your behalf.
        </p>
      </LegalSection>
    </LegalArticle>
  );
}
