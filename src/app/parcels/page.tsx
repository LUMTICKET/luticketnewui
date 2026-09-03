import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "Track a parcel — Lumiticket",
};

const stages = [
  { label: "Registered", done: true },
  { label: "In transit", done: true },
  { label: "Out for delivery", done: false },
  { label: "Delivered", done: false },
];

export default async function ParcelsPage(props: PageProps<"/parcels">) {
  const params = await props.searchParams;
  const ref = typeof params.ref === "string" ? params.ref : "";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-navy-950">Track a parcel</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Enter your tracking number to see live status and handling history.
      </p>

      <form className="mt-6 flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="tracking">
          Tracking number
        </label>
        <input
          id="tracking"
          name="ref"
          defaultValue={ref}
          placeholder="e.g. LMT-PCL-20481"
          className="h-12 flex-1 rounded-xl border border-line px-3.5 text-sm focus:border-navy-400"
        />
        <Button type="submit" variant="primary" size="lg">
          Track parcel
        </Button>
      </form>

      {ref ? (
        <div className="mt-10 rounded-2xl border border-line p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs text-ink-faint">Tracking number</p>
              <p className="text-lg font-bold text-navy-950">{ref}</p>
            </div>
            <Badge tone="warning">In transit</Badge>
          </div>

          <ol className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stages.map((stage, i) => (
              <li key={stage.label} className="flex flex-col items-center text-center">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                    stage.done
                      ? "bg-navy-950 text-white"
                      : "bg-surface-alt text-ink-faint"
                  }`}
                >
                  {i + 1}
                </span>
                <span
                  className={`mt-2 text-xs font-medium ${
                    stage.done ? "text-navy-950" : "text-ink-faint"
                  }`}
                >
                  {stage.label}
                </span>
              </li>
            ))}
          </ol>

          <p className="mt-8 text-sm text-ink-muted">
            Last update: departed Lilongwe sorting hub, heading to Blantyre
            depot. Estimated delivery within 1–2 business days.
          </p>
        </div>
      ) : (
        <p className="mt-10 text-sm text-ink-faint">
          No tracking number entered yet — try{" "}
          <span className="font-medium text-ink">LMT-PCL-20481</span> as a
          sample.
        </p>
      )}
    </div>
  );
}
