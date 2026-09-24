import {
  BusinessRolePage,
  type BusinessRoleContent,
} from "@/components/business/BusinessRolePage";

export const metadata = {
  title: "For courier operators — Lumiticket",
  description:
    "Register parcels, assign drivers, and track deliveries end to end with Lumiticket's courier platform.",
};

const content: BusinessRoleContent = {
  eyebrow: "For courier operators",
  title: "Move parcels across the region with confidence",
  intro:
    "Register parcels, assign riders or drivers, and give senders real-time tracking from pickup to drop-off — all backed by proof of delivery and insurance above your set threshold.",
  benefits: [
    {
      title: "Real-time tracking",
      body: "Senders and recipients follow every parcel's journey with live status updates, from pickup to drop-off.",
    },
    {
      title: "Rider assignment & routing",
      body: "Assign parcels to drivers or riders by zone, and reassign quickly if plans change on the road.",
    },
    {
      title: "Proof of delivery",
      body: "Capture a signature or photo at drop-off, timestamped and attached to every parcel record.",
    },
    {
      title: "Insurance above threshold",
      body: "High-value parcels are covered automatically above the threshold you agree with Lumiticket.",
    },
  ],
  steps: [
    {
      title: "Apply & verify",
      body: "Submit your national ID or courier operating licence, along with your registered operating zones.",
    },
    {
      title: "Register your fleet",
      body: "Add your drivers or riders, their vehicles, and the zones or routes they cover.",
    },
    {
      title: "Accept parcels",
      body: "Senders book a parcel through Lumiticket; you accept, assign a rider, and start tracking.",
    },
    {
      title: "Deliver & get paid",
      body: "Capture proof of delivery on drop-off, and receive automatic payouts for completed deliveries.",
    },
  ],
  requirements: [
    "National ID or courier operating licence",
    "Vehicle and rider registration with declared operating zones",
    "Goods-in-transit insurance above the agreed value threshold",
    "Signed settlement agreement with Lumiticket",
    "A bank account or mobile money wallet for payouts",
  ],
  payout: "Payouts are settled per completed delivery to your linked bank account or mobile money wallet, net of the Lumiticket service fee, with a statement for every parcel.",
  faqs: [
    {
      question: "What counts as an operating zone?",
      answer:
        "The towns, cities, or regions you commit to covering for pickup and delivery — senders only see your service where you're registered to operate.",
    },
    {
      question: "Who's responsible if a parcel is lost or damaged?",
      answer:
        "Parcels above the agreed insurance threshold are covered automatically; smaller parcels are handled under your standard courier liability terms.",
    },
    {
      question: "Can I add or remove riders later?",
      answer:
        "Yes — manage your rider roster, vehicles, and zones at any time from your courier dashboard.",
    },
    {
      question: "How is proof of delivery captured?",
      answer:
        "Riders capture a signature or photo in the driver app at drop-off, timestamped and linked to the parcel automatically.",
    },
  ],
};

export default function CouriersPage() {
  return <BusinessRolePage content={content} />;
}
