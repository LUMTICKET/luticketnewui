import {
  BusinessRolePage,
  type BusinessRoleContent,
} from "@/components/business/BusinessRolePage";

export const metadata = {
  title: "For retail & POS agents — Lumiticket",
  description:
    "Sell bus tickets, event tickets, and register parcels in person on Lumiticket's behalf, and earn commission per transaction.",
};

const content: BusinessRoleContent = {
  eyebrow: "For retail & POS agents",
  title: "Earn commission selling tickets and parcels in person",
  intro:
    "Sell bus tickets, event tickets, and register parcels for walk-in customers using a Lumiticket POS device — with a daily float, clear transaction limits, and commission paid on every sale.",
  benefits: [
    {
      title: "One device, three services",
      body: "Sell bus tickets, event tickets, and register parcels from a single registered POS device.",
    },
    {
      title: "Commission per transaction",
      body: "Earn a set commission on every ticket sold or parcel registered through your device.",
    },
    {
      title: "Daily limits & float management",
      body: "Operate within clear daily transaction limits, with float top-ups and reconciliation built in.",
    },
    {
      title: "Simple onboarding",
      body: "Register your business and device once — no specialised hardware beyond a smartphone or tablet required.",
    },
  ],
  steps: [
    {
      title: "Apply & verify",
      body: "Submit your business or sole-trader registration and complete ID verification with a photo capture.",
    },
    {
      title: "Register your device",
      body: "Link the smartphone or tablet you'll use as your POS device, and set your daily transaction limit.",
    },
    {
      title: "Sell in person",
      body: "Serve walk-in customers buying bus tickets, event tickets, or sending a parcel, using live inventory.",
    },
    {
      title: "Reconcile & get paid",
      body: "Your float and sales reconcile automatically each day, and commission is paid out on schedule.",
    },
  ],
  requirements: [
    "Business or sole-trader registration",
    "ID verification with photo capture",
    "POS device registration (smartphone or tablet)",
    "Agreed daily transaction limit and float arrangement",
    "A bank account or mobile money wallet for commission payouts",
  ],
  payout: "Commission on tickets sold and parcels registered accrues per transaction and is paid out to your linked bank account or mobile money wallet on your agreed schedule.",
  faqs: [
    {
      question: "Do I need special hardware?",
      answer:
        "No — a smartphone or tablet registered as your POS device is enough to sell tickets and register parcels.",
    },
    {
      question: "How is my daily transaction limit set?",
      answer:
        "It's agreed during onboarding based on your float and business volume, and can be reviewed as your agency grows.",
    },
    {
      question: "How much commission do I earn?",
      answer:
        "Commission is a set percentage per transaction, confirmed in your agent agreement during onboarding.",
    },
    {
      question: "Can I sell for more than one service?",
      answer:
        "Yes — a single registered device lets you sell bus tickets, event tickets, and register parcels.",
    },
  ],
};

export default function RetailAgentsPage() {
  return <BusinessRolePage content={content} />;
}
