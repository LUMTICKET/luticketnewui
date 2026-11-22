export interface BusinessType {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

interface BusinessTypesResponse {
  businessTypes: BusinessType[];
}

/**
 * The workspace each business type opens. Kept as one place so a new type in
 * the database only needs one mapping entry — and so customer-only types (or
 * unknown future ones) resolve to no workspace rather than guessing.
 */
const SLUG_TO_WORKSPACE: Record<string, "bus-operator" | "organizer"> = {
  "bus-operator": "bus-operator",
  "event-organizer": "organizer",
  "flight-operator": "organizer",
  "tour-operator": "organizer",
};

export function workspaceForBusinessType(businessType: { slug?: string } | null | undefined) {
  return SLUG_TO_WORKSPACE[businessType?.slug ?? ""] ?? null;
}

/** Fetches the business types seeded in the API database (public endpoint). */
export async function fetchBusinessTypes(): Promise<BusinessType[]> {
  const { publicApiRequest } = await import("@/lib/auth");
  const payload = await publicApiRequest<BusinessTypesResponse>("/api/business-types");
  return payload.businessTypes ?? [];
}
