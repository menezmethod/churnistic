export type OfferType = 'bank' | 'brokerage' | 'credit_card';

export interface BonusRequirements {
  title: string;
  description: string;
}

export interface BonusTier {
  reward: string;
  deposit: string;
}

export interface Bonus {
  title: string;
  description: string;
  requirements: BonusRequirements;
  tiers?: BonusTier[];
  additional_info?: string;
}

export interface MonthlyFees {
  amount: string;
}

export interface StateAvailability {
  type: 'State';
  states: string[];
}

export interface NationwideAvailability {
  type: 'Nationwide';
  states?: never;
}

export interface Logo {
  type: string;
  url: string;
}

export interface CardImage {
  url: string;
  network?: string;
  color?: string;
  badge?: string;
}

export interface Details {
  monthly_fees: MonthlyFees;
  account_type: string;
  availability: StateAvailability | NationwideAvailability;
  credit_inquiry?: string;
  household_limit?: string;
  early_closure_fee?: string;
  chex_systems?: string;
  expiration?: string;
}

export interface FormData {
  name: string;
  type: OfferType;
  offer_link: string;
  value: string;
  bonus: Bonus;
  details: Details;
  logo: Logo;
  card_image?: CardImage;
}

export type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

export type PathValue<T, P extends string> = P extends keyof T
  ? T[P]
  : P extends `${infer K}.${infer Rest}`
    ? K extends keyof T
      ? PathValue<T[K], Rest>
      : never
    : never;
