export const ASSET_CATEGORIES = [
  "property",
  "plant_machinery",
  "motor_vehicle",
  "art_collectibles",
] as const;

export type AssetCategory = (typeof ASSET_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<AssetCategory, string> = {
  property: "Property",
  plant_machinery: "Plant & Machinery",
  motor_vehicle: "Motor Vehicle",
  art_collectibles: "Art & Collectibles",
};

export function humanizeKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export interface CategoryField {
  name: string;
  label: string;
  type: "text" | "number" | "textarea" | "select";
  required?: boolean;
  options?: string[];
}

export const CATEGORY_FIELDS: Record<AssetCategory, CategoryField[]> = {
  property: [
    {
      name: "property_type",
      label: "Property type",
      type: "select",
      required: true,
      options: [
        "Residential",
        "Commercial Office",
        "Retail",
        "Industrial / Warehouse",
        "Agricultural",
        "Vacant Land",
      ],
    },
    { name: "building_size_sqm", label: "Building size (sqm)", type: "number" },
    { name: "land_size_sqm", label: "Land size (sqm)", type: "number" },
    { name: "year_built", label: "Year built", type: "number" },
    { name: "condition_notes", label: "Condition notes", type: "textarea" },
  ],
  plant_machinery: [
    { name: "make", label: "Make", type: "text", required: true },
    { name: "model", label: "Model", type: "text", required: true },
    { name: "year", label: "Year", type: "number" },
    { name: "hours_used", label: "Hours used", type: "number" },
    { name: "condition_notes", label: "Condition notes", type: "textarea" },
  ],
  motor_vehicle: [
    { name: "make", label: "Make", type: "text", required: true },
    { name: "model", label: "Model", type: "text", required: true },
    { name: "year", label: "Year", type: "number" },
    { name: "mileage_km", label: "Mileage (km)", type: "number" },
    { name: "registration", label: "Registration number", type: "text" },
    { name: "condition_notes", label: "Condition notes", type: "textarea" },
  ],
  art_collectibles: [
    { name: "artist", label: "Artist / Maker", type: "text", required: true },
    { name: "medium", label: "Medium", type: "text" },
    { name: "dimensions", label: "Dimensions", type: "text" },
    { name: "provenance", label: "Provenance", type: "textarea" },
    { name: "condition_notes", label: "Condition notes", type: "textarea" },
  ],
};

export const SUBJECT_TITLE_LABELS: Record<AssetCategory, string> = {
  property: "Property address",
  plant_machinery: "Machine description (e.g. CAT 320D Excavator)",
  motor_vehicle: "Vehicle description (e.g. 2019 Toyota Hilux 2.8 GD-6)",
  art_collectibles: "Title of work",
};
