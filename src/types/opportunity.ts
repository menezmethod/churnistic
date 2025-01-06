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

export type USState = 'AL' | 'AK' | 'AZ' | 'AR' | 'CA' | 'CO' | 'CT' | 'DE' | 'FL' | 'GA' |
  'HI' | 'ID' | 'IL' | 'IN' | 'IA' | 'KS' | 'KY' | 'LA' | 'ME' | 'MD' |
  'MA' | 'MI' | 'MN' | 'MS' | 'MO' | 'MT' | 'NE' | 'NV' | 'NH' | 'NJ' |
  'NM' | 'NY' | 'NC' | 'ND' | 'OH' | 'OK' | 'OR' | 'PA' | 'RI' | 'SC' |
  'SD' | 'TN' | 'TX' | 'UT' | 'VT' | 'VA' | 'WA' | 'WV' | 'WI' | 'WY';

export interface StateAvailability {
  type: 'State';
  states: USState[];
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
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object | undefined
    ? `${Key}` | `${Key}.${NestedKeyOf<NonNullable<ObjectType[Key]>>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

export type PathValue<T, P extends string> = P extends keyof T
  ? T[P]
  : P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? PathValue<T[K], Rest>
    : never
  : never;
