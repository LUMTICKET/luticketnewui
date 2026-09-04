import { Badge } from "@/components/ui/Badge";
import { SearchBand } from "@/components/search/SearchBand";
import { ModuleSearchBar } from "@/components/search/ModuleSearchBar";

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
    <div>
      <SearchBand>
        <ModuleSearchBar module="parcel" defaultRef={ref} />
      </SearchBand>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        {ref ? (
          <div className="rounded-2xl border border-line p-6">
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
          <p className="text-sm text-ink-faint">
            No tracking number entered yet — try{" "}
            <span className="font-medium text-ink">LMT-PCL-20481</span> as a
            sample.
          </p>
        )}
      </div>
    </div>
  );
}
