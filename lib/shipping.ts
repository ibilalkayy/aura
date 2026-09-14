// A distance/region heuristic, not a live carrier API — there's no real
// shipping integration behind this. Deliberately disclosed rather than
// presented as precise.

type Region =
  | "Domestic (within Pakistan)"
  | "Neighboring country"
  | "Asia"
  | "Middle East & North Africa"
  | "Europe & Africa"
  | "Americas & Oceania";

const NEIGHBORING = ["India", "China", "Afghanistan", "Iran"];

const ASIA = [
  "Bangladesh", "Sri Lanka", "Nepal", "Maldives", "Myanmar", "Thailand",
  "Vietnam", "Cambodia", "Malaysia", "Singapore", "Indonesia", "Philippines",
  "Japan", "South Korea", "Taiwan", "Hong Kong", "Mongolia", "Kazakhstan",
  "Uzbekistan", "Kyrgyzstan", "Tajikistan", "Turkmenistan", "Azerbaijan",
  "Armenia", "Georgia",
];

const MIDDLE_EAST_NORTH_AFRICA = [
  "United Arab Emirates", "Saudi Arabia", "Qatar", "Kuwait", "Bahrain",
  "Oman", "Turkey", "Israel", "Jordan", "Lebanon", "Syria", "Iraq", "Yemen",
  "Egypt", "Libya", "Tunisia", "Algeria", "Morocco", "Sudan",
];

const EUROPE_AFRICA = [
  "United Kingdom", "France", "Germany", "Italy", "Spain", "Portugal",
  "Netherlands", "Belgium", "Switzerland", "Austria", "Sweden", "Norway",
  "Denmark", "Finland", "Poland", "Czech Republic", "Slovakia", "Hungary",
  "Romania", "Bulgaria", "Greece", "Ireland", "Iceland", "Croatia",
  "Serbia", "Slovenia", "Bosnia and Herzegovina", "North Macedonia",
  "Albania", "Estonia", "Latvia", "Lithuania", "Ukraine", "Belarus",
  "Moldova", "Russia", "Cyprus", "Malta", "Luxembourg", "Monaco",
  "South Africa", "Nigeria", "Kenya", "Ghana", "Ethiopia", "Tanzania",
  "Uganda", "Zambia", "Zimbabwe", "Cameroon",
];

const ESTIMATES: Record<Region, { min: number; max: number }> = {
  "Domestic (within Pakistan)": { min: 1, max: 3 },
  "Neighboring country": { min: 3, max: 5 },
  "Asia": { min: 4, max: 7 },
  "Middle East & North Africa": { min: 4, max: 7 },
  "Europe & Africa": { min: 6, max: 10 },
  "Americas & Oceania": { min: 8, max: 14 },
};

export function estimateDelivery(countryName: string): { min: number; max: number; region: Region } {
  const name = countryName.trim();

  let region: Region;
  if (name.toLowerCase() === "pakistan") region = "Domestic (within Pakistan)";
  else if (NEIGHBORING.includes(name)) region = "Neighboring country";
  else if (ASIA.includes(name)) region = "Asia";
  else if (MIDDLE_EAST_NORTH_AFRICA.includes(name)) region = "Middle East & North Africa";
  else if (EUROPE_AFRICA.includes(name)) region = "Europe & Africa";
  else region = "Americas & Oceania";

  return { ...ESTIMATES[region], region };
}
