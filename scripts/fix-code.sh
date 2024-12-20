#!/usr/bin/env bash

# Strict mode
set -euo pipefail
IFS=$'\n\t'

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# Coverage thresholds
readonly BUSINESS_LOGIC_THRESHOLD=90
readonly API_ROUTES_THRESHOLD=85
readonly UI_COMPONENTS_THRESHOLD=80
readonly UTILITY_THRESHOLD=75

# Output format markers for LLM parsing
readonly SECTION_START="<<<<<<<<<< SECTION START:"
readonly SECTION_END=">>>>>>>>>> SECTION END:"
readonly ERROR_START="<<<<<<<<<< ERROR START"
readonly ERROR_END=">>>>>>>>>>>> ERROR END"
readonly FILE_START="<<<<<<<<<< FILE:"
readonly FILE_END=">>>>>>>>>>>> END FILE"
readonly SUGGESTION_START="<<<<<<<<<< SUGGESTION:"
readonly SUGGESTION_END=">>>>>>>>>>>> END SUGGESTION"

# Common patterns for auto-fixing
readonly MISSING_RETURN_TYPE_PATTERN="Missing return type on function"
readonly IMPORT_ORDER_PATTERN="There should be at least one empty line between import groups"
readonly IMPORT_WRONG_ORDER_PATTERN="import should occur before import of"

# Error handler
handle_error() {
  local line_number=$1
  local error_code=$2
  log_error "An error occurred in line ${line_number}, exit code: ${error_code}"
  exit 1
}

# Set up error handling
trap 'handle_error ${LINENO} $?' ERR

# Check dependencies
check_dependencies() {
  echo "${SECTION_START} DEPENDENCY CHECK"
  
  local missing_deps=()
  
  # Required commands
  local commands=("npm" "node" "jq" "bc")
  for cmd in "${commands[@]}"; do
    if ! command -v "$cmd" &> /dev/null; then
      missing_deps+=("$cmd")
    fi
  done
  
  # Required files
  local files=("package.json" "tsconfig.json" ".eslintrc.json" ".prettierrc")
  for file in "${files[@]}"; do
    if [[ ! -f "$file" ]]; then
      missing_deps+=("$file")
    fi
  done
  
  if [[ ${#missing_deps[@]} -ne 0 ]]; then
    echo "${ERROR_START}"
    echo "MISSING DEPENDENCIES:"
    printf '%s\n' "${missing_deps[@]}"
    echo "${ERROR_END}"
    exit 1
  fi
  
  echo "${SECTION_END} DEPENDENCY CHECK"
}

# Function to check test coverage
check_coverage() {
  echo "${SECTION_START} COVERAGE CHECK"
  
  local coverage_file="coverage/coverage-summary.json"
  
  if [[ ! -f "$coverage_file" ]]; then
    log_info "Coverage file not found. Running tests with coverage..."
    npm run test:coverage
  fi

  # Read and format coverage data for LLM
  echo "${FILE_START} ${coverage_file}"
  cat "$coverage_file"
  echo "${FILE_END}"

  local coverage_failed=false
  local coverage_report=""

  # Check each coverage type
  local types=("business_logic:src/lib/:${BUSINESS_LOGIC_THRESHOLD}" 
              "api_routes:src/app/api/:${API_ROUTES_THRESHOLD}"
              "ui_components:src/app/components/:${UI_COMPONENTS_THRESHOLD}"
              "utility:src/utils/:${UTILITY_THRESHOLD}")

  for type_info in "${types[@]}"; do
    IFS=':' read -r name path threshold <<< "${type_info}"
    local coverage=$(jq ".\"${path}\".lines.pct" "$coverage_file")
    
    if (( $(echo "$coverage < $threshold" | bc -l) )); then
      coverage_failed=true
      log_llm_error "$path" "coverage" "Coverage ${coverage}% is below threshold ${threshold}%" \
        "N/A" "N/A" "$(jq ".\"${path}\"" "$coverage_file")"
    fi
  done

  echo "${SECTION_END} COVERAGE CHECK"
  return $([ "$coverage_failed" == "true" ] && echo 1 || echo 0)
}

# Logging functions
log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1" >&2
}

# LLM-friendly error output with fix suggestions
log_llm_error() {
  local file=$1
  local error_type=$2
  local message=$3
  local line=${4:-"N/A"}
  local column=${5:-"N/A"}
  local code_snippet=${6:-"N/A"}
  local fix_suggestion=${7:-""}
  
  echo "${ERROR_START}"
  echo "FILE: ${file}"
  echo "TYPE: ${error_type}"
  echo "LINE: ${line}"
  echo "COLUMN: ${column}"
  echo "MESSAGE: ${message}"
  if [[ "${code_snippet}" != "N/A" ]]; then
    echo "CODE_CONTEXT:"
    echo "```"
    echo "${code_snippet}"
    echo "```"
  fi
  if [[ -n "${fix_suggestion}" ]]; then
    echo "${SUGGESTION_START}"
    echo "${fix_suggestion}"
    echo "${SUGGESTION_END}"
  fi
  echo "${ERROR_END}"
}

# Function to suggest fixes for common issues
suggest_fix() {
  local error_type=$1
  local message=$2
  local file=$3
  local line=$4
  local code_snippet=$5

  case "${error_type}" in
    "@typescript-eslint/explicit-function-return-type" | "@typescript-eslint/explicit-module-boundary-types")
      # Extract function signature and suggest return type
      if [[ "${code_snippet}" =~ function[[:space:]]+([a-zA-Z0-9_]+)[[:space:]]*\((.*)\) ]]; then
        local func_name="${BASH_REMATCH[1]}"
        local params="${BASH_REMATCH[2]}"
        echo "Add return type to function: function ${func_name}(${params}): JSX.Element"
      fi
      ;;
    "@typescript-eslint/no-misused-promises")
      echo "Wrap the async function in a synchronous handler:

const handle${line}Click = () => {
  void (async () => {
    // Your async code here
  })();
};"
      ;;
    "import/order")
      if [[ "${message}" =~ ${IMPORT_ORDER_PATTERN} ]]; then
        echo "Add empty line between import groups and sort imports:

// External imports
import { something } from 'external-package';

// Internal imports
import { other } from '@/internal';"
      elif [[ "${message}" =~ ${IMPORT_WRONG_ORDER_PATTERN} ]]; then
        echo "Reorder imports alphabetically within their groups"
      fi
      ;;
    *)
      echo "No automatic fix suggestion available. Please review the error message and fix manually."
      ;;
  esac
}

# Function to run and parse ESLint with detailed fix suggestions
run_eslint() {
  echo "${SECTION_START} ESLINT"
  
  # Run ESLint with detailed output
  local eslint_output
  eslint_output=$(npx eslint . --format json)
  local exit_code=$?
  
  # Check if ESLint found any issues
  if [ $exit_code -eq 0 ]; then
    log_success "No ESLint issues found"
    echo "${SECTION_END} ESLINT"
    return 0
  fi
  
  # Parse and format ESLint output
  if [ -n "$eslint_output" ]; then
    echo "$eslint_output" | while IFS= read -r file_data; do
      if [[ -z "$file_data" ]]; then
        continue
      fi
      
      # Extract file path and messages
      local file_path=$(echo "$file_data" | jq -r '.filePath // empty')
      if [[ -z "$file_path" ]]; then
        continue
      fi
      
      echo "${FILE_START} ${file_path}"
      echo "$file_data" | jq -r '.messages[] | {
        type: (.severity == 2 | if . then "error" else "warning" end),
        rule: .ruleId,
        line: .line,
        column: .column,
        message: .message,
        source: .source
      }' | while IFS= read -r error_data; do
        # Extract error details
        local error_type=$(echo "$error_data" | jq -r '.rule // empty')
        local error_message=$(echo "$error_data" | jq -r '.message // empty')
        local error_line=$(echo "$error_data" | jq -r '.line // empty')
        local error_column=$(echo "$error_data" | jq -r '.column // empty')
        local code_context=$(echo "$error_data" | jq -r '.source // empty')
        
        if [[ -n "$error_type" && -n "$error_message" ]]; then
          # Get fix suggestion
          local fix_suggestion=$(suggest_fix "${error_type}" "${error_message}" "${file_path}" "${error_line}" "${code_context}")
          
          # Log error with fix suggestion
          log_llm_error "${file_path}" "${error_type}" "${error_message}" "${error_line}" \
            "${error_column}" "${code_context}" "${fix_suggestion}"
        fi
      done
      echo "${FILE_END}"
    done
  else
    log_error "Failed to get ESLint output"
  fi
  
  echo "${SECTION_END} ESLINT"
}

# Function to run and parse TypeScript errors with fix suggestions
run_typescript_check() {
  echo "${SECTION_START} TYPESCRIPT"
  
  # Run TypeScript check and capture output
  local ts_output
  ts_output=$(npm run type-check 2>&1 || true)
  
  # Parse and format TypeScript errors for LLM
  if [[ $ts_output =~ "error TS" ]]; then
    echo "$ts_output" | while IFS= read -r line; do
      if [[ $line =~ ^.*\(([0-9]+,[0-9]+)\):\ error\ TS([0-9]+):\ (.*)$ ]]; then
        local file_path=${line%%(*}
        local position=${BASH_REMATCH[1]}
        local error_code=${BASH_REMATCH[2]}
        local message=${BASH_REMATCH[3]}
        
        # Get fix suggestion based on error code
        local fix_suggestion=""
        case "${error_code}" in
          2307) # Cannot find module
            fix_suggestion="Check import path and ensure the module exists. You might need to:
1. Fix the import path
2. Install the missing package
3. Add type definitions (@types/*)"
            ;;
          2322) # Type mismatch
            fix_suggestion="Ensure the types match. Consider:
1. Using type assertion
2. Updating the type definition
3. Using a type guard"
            ;;
          *) # Other TypeScript errors
            fix_suggestion="Review the TypeScript documentation for error TS${error_code}"
            ;;
        esac
        
        log_llm_error "$file_path" "typescript" "TS${error_code}: ${message}" \
          "${position%%,*}" "${position#*,}" "" "${fix_suggestion}"
      fi
    done
  fi
  
  echo "${SECTION_END} TYPESCRIPT"
}

# Main function
main() {
  local start_time
  start_time=$(date +%s)

  echo "${SECTION_START} QUALITY CHECK"
  
  # Check dependencies first
  check_dependencies

  # Run Prettier formatting
  log_info "Running Prettier formatting..."
  if ! npm run format; then
    log_llm_error "prettier" "formatting" "Prettier formatting failed. Check prettier output above."
  fi

  # Run ESLint with fix suggestions
  log_info "Running ESLint checks..."
  run_eslint

  # Run TypeScript checks with fix suggestions
  log_info "Running TypeScript checks..."
  run_typescript_check

  # Run tests and coverage
  log_info "Running tests and coverage checks..."
  check_coverage

  # Calculate and report execution time
  local end_time
  end_time=$(date +%s)
  local duration=$((end_time - start_time))

  echo "${SECTION_START} SUMMARY"
  echo "EXECUTION_TIME: ${duration} seconds"
  echo "TIMESTAMP: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  echo "${SECTION_END} SUMMARY"
  
  echo "${SECTION_END} QUALITY CHECK"
}

# Run main function
main "$@"