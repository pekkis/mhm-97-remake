import { CountryCodes } from "../types/base";

type CountryData = {
  iso: CountryCodes;
  name: string;
  strength: () => number;
};

export const countryData: Record<CountryCodes, CountryData> = {
  FI: {
    iso: "FI",
    name: "Pekkalandia",
    strength: () => 100
  },
  CA: {
    iso: "CA",
    name: "Kanada",
    strength: () => 202
  },
  US: {
    iso: "US",
    name: "Yhdysvallat",
    strength: () => 194
  },
  SE: {
    iso: "SE",
    name: "Ruotsi",
    strength: () => 206
  },
  FR: {
    iso: "FR",
    name: "Ranska",
    strength: () => 153
  },
  CZ: {
    iso: "CZ",
    name: "Tshekki",
    strength: () => 208
  },
  SK: {
    iso: "SK",
    name: "Slovakia",
    strength: () => 189
  },
  RU: {
    iso: "RU",
    name: "Venäjä",
    strength: () => 211
  },
  DE: {
    iso: "DE",
    name: "Saksa",
    strength: () => 170
  },
  LV: {
    iso: "LV",
    name: "Latvia",
    strength: () => 163
  },
  IT: {
    iso: "IT",
    name: "Italia",
    strength: () => 168
  },
  CH: {
    iso: "CH",
    name: "Sveitsi",
    strength: () => 159
  }
};

export default countryData;
