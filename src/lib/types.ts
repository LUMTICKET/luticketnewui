export type ServiceKind = "bus" | "events" | "parcel";

export interface Country {
  code: string;
  name: string;
  currency: string;
  flag: string;
  live: boolean;
}

export interface BusRoute {
  id: string;
  origin: string;
  destination: string;
  operator: string;
  duration: string;
  fromPrice: number;
  currency: string;
  departures: number;
  rating: number;
}

export interface EventListing {
  id: string;
  title: string;
  category: string;
  venue: string;
  city: string;
  date: string;
  fromPrice: number;
  currency: string;
  status: "on-sale" | "selling-fast" | "sold-out";
}
