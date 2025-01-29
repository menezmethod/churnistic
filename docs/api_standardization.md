# API Standardization Guide

## Current Inconsistencies

### 1. Offer Link Format

- **Issue**: The `offer_link` field is being transformed incorrectly
  - Detailed API: `"offer_link": "https://www.wisconsinbankandtrust.com"`
  - Final API: `"offer_link": "/api/opportunities/flmFHyDxMp5ATMcH6hzw/redirect"`
- **Required Fix**: Preserve original offer link from detailed API

### 2. Missing Fields

- **Issue**: Several fields are missing or null in the final API that exist in the detailed API
  - `household_limit`
  - `early_closure_fee`
  - `chex_systems`
  - Some fields are present in source but missing in transformation
- **Additional Issue**: Some fields are inconsistently present across different offer types
  - Credit card specific fields appearing in bank offers
  - Brokerage fields not properly isolated

### 3. Metadata Structure

- **Issue**: Metadata fields are inconsistent between APIs
  - Detailed API:
    ```json
    "metadata": {
      "created": "2025-01-24T20:03:05.361Z",
      "updated": "2025-01-24T20:03:05.361Z"
    }
    ```
  - Final API:
    ```json
    "metadata": {
      "created_at": "2025-01-28T19:50:46.375Z",
      "updated_at": "2025-01-28T20:17:15.690Z",
      "created_by": "admin@test.com",
      "status": "active",
      "environment": "development"
    }
    ```

### 4. Description Field

- **Issue**: Description field is missing in detailed API but present in final API
- **Required Fix**: Add description field to transformation
- **Additional Context**: Description should be derived from bonus.description for consistency

### 5. Type-Specific Fields

- **Issue**: Some fields are type-specific but not properly handled
  - Credit Card specific fields appearing in bank offers
  - Brokerage specific fields not consistently applied
- **New Finding**: Each type has unique fields that should be isolated:
  - Credit Cards: card_image, annual_fees, foreign_transaction_fees, under_5_24
  - Brokerages: options_trading, ira_accounts
  - Banks: chex_systems, early_closure_fee

### 6. Emoji Handling

- **Issue**: Some fields contain emojis that should be standardized
  - Example: `"foreign_transaction_fees": "None 🙂"` vs `"foreign_transaction_fees": "Yes 🙁"`
- **Required Fix**: Remove emojis or standardize their usage

## Standardization Checklist

### Base Fields (All Types)

- [✅] id (string)
- [✅] name (string)
- [✅] type ("bank" | "credit_card" | "brokerage")
- [✅] description (string) - derived from bonus.description
- [❌] offer_link (string, full URL) - Currently using relative paths
- [✅] value (number)

### Bonus Structure

- [✅] title (string)
- [✅] description (string)
- [✅] requirements
  - [✅] title (string)
  - [✅] description (string)
- [✅] additional_info (string | null)
- [✅] tiers (array)
  - [✅] reward (string)
  - [✅] deposit (string)

### Details Structure (Base)

- [✅] monthly_fees
  - [✅] amount (string)
  - [❌] waiver_details (string | null) - Inconsistently present
- [✅] account_type (string)
- [❌] availability
  - [✅] type ("Nationwide" | "State")
  - [❌] states (string[] | null) - Missing in some cases
- [✅] credit_inquiry (string | null)
- [❌] expiration (string | null) - Inconsistent format

### Type-Specific Fields

#### Bank Account Details

- [❌] household_limit (string | null) - Missing in most cases
- [⚠️] early_closure_fee (string | null) - Present but needs standardization
- [❌] chex_systems (string | null) - Missing in most cases

#### Credit Card Details

- [⚠️] card_image
  - [✅] url (string)
  - [❌] network (string) - Usually "Unknown"
  - [❌] color (string) - Usually "Unknown"
  - [❌] badge (string | null) - Inconsistently present
- [✅] annual_fees (string | null)
- [❌] foreign_transaction_fees (string | null) - Contains emojis
- [❌] under_5_24 (string | null) - Only present for Chase cards

#### Brokerage Details

- [✅] options_trading (string | null)
- [✅] ira_accounts (string | null)

### Logo Structure

- [✅] type ("icon")
- [✅] url (string)

### Metadata Structure

- [❌] created_at (ISO string) - Inconsistent naming (created vs created_at)
- [❌] updated_at (ISO string) - Inconsistent naming (updated vs updated_at)
- [✅] created_by (string)
- [✅] status ("active" | "inactive")
- [✅] environment ("development" | "production")

## Implementation Strategy

1. **Data Validation**

   - Implement strict type checking
   - Add validation for required fields
   - Add validation for field formats (URLs, dates, etc.)
   - Add type-specific field validation

2. **Transformation Logic**

   - Update transformer to handle all fields consistently
   - Add proper null handling
   - Implement type-specific field handling
   - Clean and standardize text fields (remove emojis, standardize formatting)

3. **Testing**

   - Add unit tests for each field transformation
   - Add integration tests for full API responses
   - Add validation tests for each offer type
   - Add tests for type-specific fields

4. **Documentation**
   - Update API documentation with all fields
   - Add examples for each offer type
   - Document validation rules
   - Document type-specific requirements

## Notes for Development

1. **Field Preservation**

   - Always preserve original URLs
   - Maintain all non-null fields from source
   - Use explicit null for missing optional fields
   - Clean text fields of emojis and standardize formatting

2. **Type Safety**

   - Use TypeScript interfaces for all structures
   - Add runtime type checking
   - Validate all transformed data
   - Add type guards for type-specific fields

3. **Error Handling**

   - Add proper error messages for missing required fields
   - Log warnings for unexpected field values
   - Implement fallback values where appropriate
   - Add validation for type-specific fields

4. **Performance**
   - Optimize transformations
   - Add caching where appropriate
   - Minimize unnecessary null checks
   - Batch similar transformations

## Next Steps

1. [ ] Update TypeScript interfaces with type-specific fields
2. [ ] Modify transformer logic to handle type-specific fields
3. [ ] Add validation layer with type checking
4. [ ] Update tests with type-specific cases
5. [ ] Clean and standardize text fields
6. [ ] Update documentation with type-specific details
7. [ ] Deploy changes systematically
8. [ ] Monitor for any issues
9. [ ] Gather feedback and iterate

## Files to Modify

### Core Type Definitions

1. `src/types/transformed.ts`
   - Contains base interface definitions
   - Needs updates for type-specific fields
   - Key interfaces: `TransformedOffer`, `Details`, `Bonus`, `CardImage`

### API Transformation Layer

2. `src/app/api/bank-rewards/sync/route.ts`
   - Main standardization point
   - Contains `transformBankRewardsOffer` function
   - This is where we implement our standardization logic
   - Handles transformation from source data to our standardized format

### Admin Interface

3. `src/app/admin/opportunities/hooks/useOpportunities.ts`
   - Admin-side transformation logic
   - Contains validation and normalization functions
   - Needs updates for type-specific handling

### Form Types

4. `src/app/opportunities/add/types.ts`
   - Form-specific type definitions
   - Needs alignment with core types
   - Contains validation schemas

## Implementation Order

1. Update Type Definitions

   - [ ] Modify `src/types/transformed.ts`
   - [ ] Update `src/app/opportunities/add/types.ts`
   - [ ] Ensure type consistency across files

2. Update API Transformation

   - [ ] Enhance `sync/route.ts` transformation function
   - [ ] Add validation for type-specific fields
   - [ ] Implement standardization logic

3. Update Admin Interface

   - [ ] Enhance opportunity hooks
   - [ ] Update form handling
   - [ ] Add type-specific validation

4. Testing & Validation

   - [ ] Add type-specific test cases
   - [ ] Validate transformations
   - [ ] Test edge cases

5. Documentation & Deployment
   - [ ] Update API documentation
   - [ ] Document type-specific requirements
   - [ ] Plan phased deployment

## Important Notes

1. **DO NOT Modify Source Data**

   - `transformer.ts` is our source of truth
   - We standardize at the API and Admin layers
   - Keep source data pristine

2. **Standardization Points**

   - API Layer (`sync/route.ts`)
   - Admin Layer (`useOpportunities.ts`)
   - Form Layer (`types.ts`)

3. **Data Flow**
   ```
   transformer.ts (source)
        ↓
   sync/route.ts (API standardization)
        ↓
   useOpportunities.ts (Admin standardization)
        ↓
   Final standardized data
   ```

## LLM Implementation Guidelines

### Context Management

1. **File Reading**
   - Always read the full context of files being modified
   - Pay attention to imports and type dependencies
   - Check for related type definitions

### Type Safety

1. **Interface Updates**
   - Maintain backward compatibility
   - Add new fields with optional markers
   - Document type unions and intersections

### Code Generation

1. **Transformation Logic**
   - Generate complete function implementations
   - Include error handling
   - Add type guards for type-specific fields

### Testing

1. **Test Case Generation**
   - Generate comprehensive test cases
   - Include edge cases for each type
   - Test type-specific validation

### Documentation

1. **Comments and JSDoc**
   - Add clear JSDoc comments
   - Document type-specific behavior
   - Include examples in comments

### Best Practices

1. **Code Organization**
   - Keep type-specific logic isolated
   - Use helper functions for clarity
   - Maintain consistent naming

### Error Handling

1. **Validation**
   - Add specific error messages
   - Include type checking
   - Handle missing fields gracefully

### Implementation Steps for LLMs

1. **Before Editing**

   - Read and understand existing types
   - Check for type dependencies
   - Verify import statements

2. **During Implementation**

   - Generate complete solutions
   - Include all necessary imports
   - Add comprehensive error handling

3. **After Changes**
   - Verify type consistency
   - Check for missing dependencies
   - Ensure backward compatibility

## Validation & Error Handling Specifics

### Type-Specific Validation

1. **Bank Accounts**

   ```typescript
   interface BankValidation {
     chex_systems: boolean;
     early_closure_fee: boolean;
     household_limit: boolean;
   }
   ```

2. **Credit Cards**

   ```typescript
   interface CreditCardValidation {
     annual_fees: boolean;
     foreign_transaction_fees: boolean;
     under_5_24: boolean;
     card_image: boolean;
   }
   ```

3. **Brokerages**
   ```typescript
   interface BrokerageValidation {
     options_trading: boolean;
     ira_accounts: boolean;
   }
   ```

### Error Messages

1. **Field-Specific Errors**

   ```typescript
   const errorMessages = {
     chex_systems: 'ChexSystems status required for bank accounts',
     card_image: 'Card image required for credit cards',
     options_trading: 'Options trading status required for brokerages',
   };
   ```

2. **Type Guards**
   ```typescript
   function isBankOffer(offer: TransformedOffer): offer is BankOffer {
     return offer.type === 'bank';
   }
   ```

### Validation Functions

1. **Type-Specific Validation**

   ```typescript
   function validateBankOffer(offer: BankOffer): ValidationResult {
     return {
       isValid: true,
       errors: [],
     };
   }
   ```

2. **Common Validation**
   ```typescript
   function validateCommonFields(offer: TransformedOffer): ValidationResult {
     return {
       isValid: true,
       errors: [],
     };
   }
   ```

### Error Handling Strategy

1. **Validation Pipeline**

   - Common field validation
   - Type-specific validation
   - Business rule validation
   - Data consistency checks

2. **Error Collection**

   - Gather all errors before failing
   - Provide specific error messages
   - Include field references

3. **Recovery Strategy**
   - Default values for non-critical fields
   - Fallback options for missing data
   - Logging for debugging

## Field Usage Tracking

### Components Using Fields

1. `BonusDetailsSection.tsx`
   - Uses: bonus.description, bonus.requirements
   - Safe to add: ✅ (uses optional chaining)
2. `BonusTiersSection.tsx`

   - Uses: bonus.tiers
   - Safe to add: ✅ (has null check)

3. `AccountDetailsSection.tsx`

   - Uses: details.monthly_fees, credit_inquiry, household_limit, early_closure_fee, chex_systems
   - Safe to add: ✅ (has hasDetails check)

4. `OpportunityDetails.tsx`
   - Uses: Multiple fields including rewards_structure
   - Safe to add: ✅ (uses optional chaining)

### Field Safety Status

#### Base Fields (All Types)

```typescript
interface SafetyStatus {
  field: string;
  used_in: string[];
  has_safe_checks: boolean;
  needs_update: string[];
}
```

1. **Monthly Fees**

   - Used in: AccountDetailsSection, OpportunityDetails
   - Safe checks: ✅
   - Updates needed: None

2. **Credit Inquiry**
   - Used in: AccountDetailsSection
   - Safe checks: ✅
   - Updates needed: None

#### Type-Specific Fields

1. **Bank Account**

   ```typescript
   // All fields have safe checks in AccountDetailsSection
   household_limit: ✅
   early_closure_fee: ✅
   chex_systems: ✅
   ```

2. **Credit Card**

   ```typescript
   // Need to add safe checks in:
   card_image: EditDialog;
   annual_fees: OpportunityDetails;
   foreign_transaction_fees: OpportunityDetails;
   under_5_24: OpportunityDetails;
   ```

3. **Brokerage**
   ```typescript
   // Need to add safe checks in:
   options_trading: OpportunityDetails;
   ira_accounts: OpportunityDetails;
   ```

### Implementation Safety Checklist

1. **Type Definitions** (`src/types/opportunity.ts`)

   - [ ] Add missing fields
   - [ ] Update existing types
   - [ ] Add JSDoc comments
   - [ ] Add type guards

2. **API Layer** (`src/app/api/bank-rewards/sync/route.ts`)

   - [ ] Add field mapping
   - [ ] Add validation
   - [ ] Add type checking
   - [ ] Add error handling

3. **Components**

   - [ ] Update EditDialog
   - [ ] Update OpportunityDetails
   - [ ] Add new field components
   - [ ] Add type-specific sections

4. **Testing**
   - [ ] Add type-specific test data
   - [ ] Test all components
   - [ ] Test error cases
   - [ ] Test type guards

### Safety Implementation Order

1. **Phase 1: Type Safety**

   - Update types
   - Add type guards
   - Add validation

2. **Phase 2: Data Layer**

   - Update API transformation
   - Add field mapping
   - Add validation

3. **Phase 3: UI Updates**

   - Update existing components
   - Add new components
   - Add type-specific sections

4. **Phase 4: Testing**
   - Add test cases
   - Test all scenarios
   - Verify type safety

### Rollback Plan

1. **Type Changes**

   ```typescript
   // Keep old type as backup
   export type LegacyOpportunity = {
     // ... existing type
   };
   ```

2. **Component Changes**

   - Keep old components with .old suffix
   - Use feature flags for new components
   - Add version tracking to opportunities

3. **Data Migration**

   - Add version field to opportunities
   - Keep both old and new fields during transition
   - Add migration utilities

4. **Documentation**

   - Update API documentation
   - Document type-specific requirements
   - Plan phased deployment

5. **Implementation**

   - Update TypeScript interfaces
   - Modify transformer logic
   - Add validation layer
   - Update tests
   - Update components
   - Deploy changes

6. **Monitoring**

   - Monitor for any issues
   - Gather feedback
   - Iterate

7. **Rollback**

   - Implement rollback plan
   - Test rollback
   - Deploy rollback

8. **Documentation**

   - Document rollback process
   - Plan rollback deployment

9. **Monitoring**

   - Monitor rollback
   - Gather feedback
   - Iterate

10. **Final Deployment**

    - Deploy final changes
    - Test final deployment
    - Monitor final deployment

11. **Documentation**

    - Document final deployment
    - Plan final deployment

12. **Monitoring**
    - Monitor final deployment
    - Gather feedback
    - Iterate

## Field Verification Commands

### Source API Verification

```bash
# Credit Cards - Source Truth
curl -X GET "http://localhost:3000/api/bankrewards?format=detailed&type=credit_card" | jq

# Brokerages - Source Truth
curl -X GET "http://localhost:3000/api/bankrewards?format=detailed&type=brokerage" | jq

# Bank Accounts - Source Truth
curl -X GET "http://localhost:3000/api/bankrewards?format=detailed&type=bank" | jq
```

### Final API Verification

```bash
# Current Implementation State
curl -X GET "http://localhost:3000/api/opportunities" | jq
```

### Implementation Verification Process

1. Before each implementation step:

   ```bash
   # 1. Check source fields
   curl -X GET "http://localhost:3000/api/bankrewards?format=detailed&type=$TYPE" | jq

   # 2. Check current implementation
   curl -X GET "http://localhost:3000/api/opportunities" | jq

   # 3. Compare fields and note discrepancies
   ```

2. After each implementation step:

   ```bash
   # 1. Verify changes are reflected
   curl -X GET "http://localhost:3000/api/opportunities" | jq

   # 2. Check type-specific fields
   curl -X GET "http://localhost:3000/api/opportunities?type=$TYPE" | jq

   # 3. Verify field values match source
   ```

### Field Verification Checklist

#### Credit Cards

- [ ] Verify card_image fields in source
- [ ] Verify annual_fees structure
- [ ] Verify foreign_transaction_fees
- [ ] Verify under_5_24 status

#### Brokerages

- [ ] Verify options_trading format
- [ ] Verify ira_accounts format
- [ ] Verify trading requirements

#### Bank Accounts

- [ ] Verify household_limit format
- [ ] Verify early_closure_fee structure
- [ ] Verify chex_systems format

### Implementation Steps with Verification

1. **Type Definition Updates**

   ```bash
   # Before update
   curl -X GET "http://localhost:3000/api/opportunities" | jq '.data[0].type'

   # After update - verify type field
   curl -X GET "http://localhost:3000/api/opportunities" | jq '.data[0].type'
   ```

2. **Field Mapping Updates**

   ```bash
   # Before mapping
   curl -X GET "http://localhost:3000/api/bankrewards?format=detailed" | jq '.data.offers[0]'

   # After mapping - verify transformed fields
   curl -X GET "http://localhost:3000/api/opportunities" | jq '.data[0]'
   ```

3. **Component Updates**
   ```bash
   # Verify data structure matches component expectations
   curl -X GET "http://localhost:3000/api/opportunities/$ID" | jq
   ```

## Implementation Guide for Claude

### Step 0: Initial Verification

1. Use the verification commands to check current state
2. Document all field discrepancies
3. Create a field mapping table

### Step 1: Type Safety (No Data Changes)

1. Read and analyze current types
2. Propose type updates
3. Verify with team
4. Implement type changes
5. Verify no runtime errors

### Step 2: Data Transformation (No UI Changes)

1. Read current transformation logic
2. Propose transformation updates
3. Verify with team
4. Implement transformation
5. Verify data integrity

### Step 3: UI Updates (With Type Safety)

1. Read current component implementation
2. Propose component updates
3. Verify with team
4. Implement changes
5. Verify UI rendering

### Tools Available

1. `codebase_search` - For finding relevant code
2. `read_file` - For reading file contents
3. `edit_file` - For making changes
4. `run_terminal_cmd` - For verification
5. `grep_search` - For finding specific patterns
6. `list_dir` - For exploring codebase

### Safety Checklist for Each Change

1. [ ] Verify current state with curl commands
2. [ ] Read all related files
3. [ ] Propose changes
4. [ ] Get approval
5. [ ] Make changes
6. [ ] Verify changes
7. [ ] Document updates

### Error Prevention

1. Always use optional chaining
2. Always check for null/undefined
3. Always verify types
4. Always test with curl after changes
