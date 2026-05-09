// In-memory store for MVP. Replace with PostgreSQL/PostGIS in production.

export type ReportStatus = "reported" | "verified" | "cleaning" | "cleaned" | "rejected";

export interface Report {
  id: string;
  latitude: number;
  longitude: number;
  severity: "small" | "medium" | "large" | string;
  description: string;
  tags: string[];
  status: ReportStatus;
  anonymous: boolean;
  photoUrls: string[];
  createdAt: string;
  userId?: string;
}

export const reportsDB: Report[] = [
  {
    id: "demo-1",
    latitude: 45.4642,
    longitude: 9.19,
    severity: "medium",
    description: "Pile of plastic bottles near the park",
    tags: ["Plastic"],
    status: "reported",
    anonymous: true,
    photoUrls: [],
    createdAt: new Date().toISOString()
  },
  {
    id: "demo-2",
    latitude: 45.47,
    longitude: 9.2,
    severity: "large",
    description: "Construction debris dumped",
    tags: ["Construction"],
    status: "cleaned",
    anonymous: true,
    photoUrls: [],
    createdAt: new Date().toISOString()
  }
];
