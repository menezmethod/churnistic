import { z } from 'zod';

// TODO: Replace logo URL with drag and drop upload feature
// This will be replaced with a proper file upload component that supports:
// - Drag and drop functionality
// - Image preview
// - File size and type validation
// - Direct upload to storage
// For now, we'll use a lenient URL validation for testing purposes

// Bonus tier schema that accepts string values for flexibility

export const opportunitySchema = z.object({
  type: z.enum(['bank', 'credit_card', 'brokerage']),
  name: z.string().min(1, 'Name is required'),
  offer_link: z.string().url().optional(),
  value: z.number().min(0, 'Value must be positive'),
  logo: z
    .object({
      url: z.string().url('Invalid URL').min(1, 'Logo URL is required'),
    })
    .optional(),
  bonus: z
    .object({
      description: z.string().min(1, 'Bonus description is required'),
      requirements: z
        .object({
          description: z.string().min(1, 'Bonus requirements description is required'),
          minimum_deposit: z.number().optional(),
          trading_requirements: z.string().optional(),
          holding_period: z.string().optional(),
          spending_requirement: z
            .object({
              amount: z.number().min(0, 'Amount must be positive'),
              timeframe: z.string().min(1, 'Timeframe is required'),
            })
            .optional(),
        })
        .optional(),
      tiers: z
        .array(
          z.object({
            level: z.string().min(1, 'Tier level is required'),
            value: z.number().min(0, 'Tier value must be positive'),
            minimum_deposit: z.number().optional(),
            requirements: z.string().optional(),
          })
        )
        .optional(),
      additional_info: z.string().optional(),
    })
    .optional(),
  details: z.object({
    monthly_fees: z
      .object({
        amount: z.string().min(1, 'Monthly fees amount is required'),
        waiver_details: z.string().optional(),
      })
      .optional(),
    account_type: z.string().min(1, 'Account type is required').optional(),
    account_category: z.enum(['personal', 'business']).optional(),
    availability: z
      .object({
        type: z.enum(['Nationwide', 'State']),
        states: z.array(z.string()).optional(),
        details: z.string().optional(),
      })
      .optional(),
    expiration: z.string().nullable().optional(),
    credit_score: z
      .object({
        min: z.number().min(0, 'Minimum credit score must be positive'),
        recommended: z.number().min(0, 'Recommended credit score must be positive'),
      })
      .optional(),
    under_5_24: z
      .object({
        required: z.boolean(),
        details: z.string(),
      })
      .optional(),
    annual_fees: z
      .object({
        amount: z.string().min(1, 'Annual fees amount is required'),
        waived_first_year: z.boolean(),
      })
      .optional(),
    foreign_transaction_fees: z
      .object({
        percentage: z.string().min(1, 'Percentage is required'),
        waived: z.boolean(),
      })
      .optional(),
    minimum_credit_limit: z.string().optional(),
    rewards_structure: z
      .object({
        base_rewards: z.string().optional(),
        welcome_bonus: z.string().optional(),
        bonus_categories: z
          .array(
            z.object({
              category: z.string().min(1, 'Category is required'),
              rate: z.string().min(1, 'Rate is required'),
              limit: z.string().optional(),
            })
          )
          .optional(),
      })
      .optional(),
    credit_inquiry: z.string().optional(),
    household_limit: z.string().optional(),
    early_closure_fee: z.string().optional(),
    chex_systems: z.string().optional(),
  }),
  // ... other properties if any
});

// Custom error map for better error messages
export const customErrorMap: z.ZodErrorMap = (error, ctx) => {
  switch (error.code) {
    case z.ZodIssueCode.invalid_type:
      if (error.expected === 'string') {
        return { message: 'This field is required' };
      }
      break;
    case z.ZodIssueCode.invalid_enum_value:
      return { message: 'Please select a valid option' };
    case z.ZodIssueCode.too_small:
      if (error.type === 'string') {
        return { message: `Must be at least ${error.minimum} characters` };
      }
      break;
    case z.ZodIssueCode.too_big:
      if (error.type === 'string') {
        return { message: `Must be at most ${error.maximum} characters` };
      }
      break;
  }
  return { message: ctx.defaultError };
};
