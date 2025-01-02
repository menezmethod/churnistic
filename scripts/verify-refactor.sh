#!/bin/bash

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Error tracking
ERRORS=0
WARNINGS=0

# Ignore specific warnings
IGNORED_WARNINGS=(
  "DEP0040.*punycode.*module is deprecated"
)

# Function to print section header
print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}\n"
}

# Function to check command status
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1 passed${NC}"
        return 0
    else
        echo -e "${RED}✗ $1 failed${NC}"
        ERRORS=$((ERRORS + 1))
        if [ "$2" = "exit" ]; then
            exit 1
        fi
        return 1
    fi
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}! $1${NC}"
    WARNINGS=$((WARNINGS + 1))
}

# Function to check if warning should be ignored
should_ignore_warning() {
    local warning="$1"
    for pattern in "${IGNORED_WARNINGS[@]}"; do
        if [[ "$warning" =~ $pattern ]]; then
            return 0
        fi
    done
    return 1
}

# Function to verify package integrity
verify_packages() {
    echo "Verifying package integrity..."
    
    # Check if package-lock.json exists and matches package.json
    if [ ! -f "package-lock.json" ]; then
        print_warning "package-lock.json not found"
        return 1
    fi

    # Verify lockfile integrity
    if ! npm audit --package-lock-only; then
        print_warning "Lock file integrity check failed"
        return 1
    fi

    # Verify installed dependencies match package-lock.json
    if ! npm ls --json > /dev/null 2>&1; then
        print_warning "Installed dependencies don't match package-lock.json"
        return 1
    fi

    return 0
}

# Function to clean install dependencies
clean_install() {
    echo "Performing clean install..."
    
    # Clear npm cache if it might be corrupted
    if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
        npm cache clean --force
    fi

    # Remove existing modules
    rm -rf node_modules

    # Install dependencies using ci for exact versions
    if ! npm ci; then
        print_warning "npm ci failed, falling back to npm install"
        if ! npm install; then
            return 1
        fi
    fi

    return 0
}

# Start verification process
print_header "Starting Next.js 15 Verification Process"

# Redirect stderr to a file for filtering
exec 2> >(while read -r line; do
    if ! should_ignore_warning "$line"; then
        echo "$line" >&2
    fi
done)

# Check Node.js version
print_header "Environment Check"
NODE_VERSION=$(node -v)
echo "Node.js version: $NODE_VERSION"
if [[ "$NODE_VERSION" =~ ^v20 ]]; then
    echo -e "${GREEN}✓ Node.js version is compatible${NC}"
else
    print_warning "Node.js version should be 20.x"
fi

# Check npm version
NPM_VERSION=$(npm -v)
echo "npm version: $NPM_VERSION"
if [[ "$NPM_VERSION" =~ ^10 ]]; then
    echo -e "${GREEN}✓ npm version is compatible${NC}"
else
    print_warning "npm version should be 10.x"
fi

# 1. Dependencies Check
print_header "Dependencies Verification"

# First try to verify existing installation
if verify_packages; then
    echo -e "${GREEN}✓ Dependencies verification passed${NC}"
else
    echo "Package verification failed, performing clean install..."
    if clean_install; then
        echo -e "${GREEN}✓ Dependencies installation passed${NC}"
    else
        echo -e "${RED}✗ Dependencies installation failed${NC}"
        ERRORS=$((ERRORS + 1))
        exit 1
    fi
fi

# 2. Type Checking
print_header "Type Checking"
npm run type-check
check_status "TypeScript compilation"

# 3. Linting with Next.js specific rules
print_header "Linting"
npm run lint
check_status "ESLint checks"

# 4. Test Suite with Coverage
print_header "Running Tests"
npm run test -- --coverage --coverageThreshold='{"global":{"statements":"70","branches":"70","functions":"70","lines":"70"}}'
check_status "Test suite with coverage thresholds"

# 5. Build Check
print_header "Build Verification"
NEXT_TELEMETRY_DISABLED=1 npm run build
check_status "Production build"

# 6. Check for proper file structure
print_header "File Structure Verification"

# Check for required directories (Next.js 15 structure)
required_dirs=(
    "src/app"
    "src/components"
    "src/lib"
    "src/types"
    "src/app/api"
    "src/server"
    "src/hooks"
    "src/utils"
    "public"
)

for dir in "${required_dirs[@]}"; do
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✓ $dir exists${NC}"
    else
        print_warning "Missing directory: $dir"
    fi
done

# 7. Check for critical files
print_header "Critical Files Verification"

critical_files=(
    "src/app/layout.tsx"
    "src/app/page.tsx"
    "next.config.js"
    "tsconfig.json"
    "package.json"
    "postcss.config.js"
    "tailwind.config.ts"
    ".env.local"
    ".gitignore"
    "jest.config.js"
    "jest.setup.ts"
    ".eslintrc.json"
    ".prettierrc"
)

for file in "${critical_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓ $file exists${NC}"
    else
        print_warning "Missing recommended file: $file"
    fi
done

# 8. Check for proper Next.js configuration
print_header "Next.js Configuration Verification"

# Check for proper module resolution in tsconfig.json
if grep -q '"moduleResolution": "node"' tsconfig.json; then
    echo -e "${GREEN}✓ Proper module resolution configured${NC}"
else
    print_warning "Consider using moduleResolution: node in tsconfig.json"
fi

# Check for proper Next.js config
if grep -q "experimental" next.config.js; then
    if grep -q "serverActions" next.config.js; then
        echo -e "${GREEN}✓ Server Actions configured${NC}"
    else
        print_warning "Consider enabling Server Actions"
    fi
fi

# 9. Check for environment variables
print_header "Environment Variables Verification"
required_env_vars=(
    "NEXT_PUBLIC_API_URL"
    "NEXT_PUBLIC_FIREBASE_API_KEY"
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID"
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
    "NEXT_PUBLIC_FIREBASE_APP_ID"
)

env_file=".env.local"
if [ -f "$env_file" ]; then
    echo -e "${GREEN}✓ Environment file exists${NC}"
    for var in "${required_env_vars[@]}"; do
        if grep -q "^${var}=" "$env_file"; then
            echo -e "${GREEN}✓ $var is set${NC}"
        else
            print_warning "Missing environment variable: $var"
        fi
    done
else
    echo -e "${RED}✗ Missing .env.local file${NC}"
    ERRORS=$((ERRORS + 1))
fi

# 10. Check for proper package.json scripts
print_header "Package.json Scripts Verification"
required_scripts=(
    "dev"
    "build"
    "start"
    "lint"
    "lint:fix"
    "test"
    "test:watch"
    "test:coverage"
    "type-check"
    "format"
    "format:check"
)

for script in "${required_scripts[@]}"; do
    if grep -q "\"$script\":" package.json; then
        echo -e "${GREEN}✓ $script script exists${NC}"
    else
        print_warning "Missing recommended script: $script"
    fi
done

# 11. Output Summary
print_header "Verification Summary"
echo -e "Found ${RED}$ERRORS errors${NC} and ${YELLOW}$WARNINGS warnings${NC}"

if [ $ERRORS -eq 0 ]; then
    echo -e "\n${GREEN}✓ All critical checks passed${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}! Some non-critical issues found${NC}"
    fi
else
    echo -e "\n${RED}✗ Some critical checks failed${NC}"
    exit 1
fi

print_header "Verification Process Completed"