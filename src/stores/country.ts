import { createStore } from "@xstate/store";
import { countries as countryList } from "@/data/countries";

export type CountryEntry = {
  iso: string;
  name: string;
  strength: number | undefined;
};

export type CountryStoreContext = {
  countries: Record<string, CountryEntry>;
};

const buildDefaultCountries = (): Record<string, CountryEntry> =>
  Object.values(countryList).reduce(
    (acc, country) => {
      acc[country.iso] = {
        iso: country.iso,
        name: country.name,
        strength: country.strength()
      };
      return acc;
    },
    {} as Record<string, CountryEntry>
  );

export const countryStore = createStore({
  context: {
    countries: buildDefaultCountries()
  } satisfies CountryStoreContext,
  on: {
    setStrength: (
      context,
      event: { country: string; strength: number }
    ) => {
      if (!context.countries[event.country]) {
        return context;
      }
      return {
        ...context,
        countries: {
          ...context.countries,
          [event.country]: {
            ...context.countries[event.country],
            strength: event.strength
          }
        }
      };
    },
    alterStrength: (
      context,
      event: { country: string; amount: number }
    ) => {
      const target = context.countries[event.country];
      if (!target) {
        return context;
      }
      return {
        ...context,
        countries: {
          ...context.countries,
          [event.country]: {
            ...target,
            strength: (target.strength ?? 0) + event.amount
          }
        }
      };
    },
    reset: () => ({
      countries: buildDefaultCountries()
    })
  }
});
