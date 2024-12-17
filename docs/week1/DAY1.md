# Day 1: Project Setup & Infrastructure (Monday)

## Overview

Focus on setting up the development environment and core infrastructure.

## Session Plan

### Morning Session (3 hours)

#### 1. Repository Setup

```bash
# Initialize repository
git init
git branch -M main

# Create .gitignore
npx create-gitignore node
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
```

Commit: `chore: initialize repository with gitignore`

#### 2. Next.js Project Setup

```bash
# Create Next.js project
npx create-next-app@latest churnistic --typescript --eslint --app --src-dir --import-alias "@/*"

# Navigate to project
cd churnistic

# Initialize Git
git add .
git commit -m "feat: initialize Next.js project with TypeScript"
```

#### 3. Dependencies Installation

```bash
# Install core dependencies
npm install @prisma/client @trpc/server @trpc/client @trpc/react-query @tanstack/react-query zod firebase
npm install @mui/material @emotion/react @emotion/styled @mui/icons-material @mui/x-data-grid @mui/x-date-pickers
npm install @mui/material-nextjs

# Install dev dependencies
npm install -D prettier husky lint-staged @types/node

# Initialize Husky
npx husky-init && npm install
```

Commit: `chore: add core dependencies including Material UI and development tools`

### Mid-Morning Session (2 hours)

#### 4. Firebase Setup

1. Create Firebase project in console
2. Enable Authentication
3. Configure auth providers:
   - Email/Password
   - Google
   - GitHub

#### 5. Environment Configuration

```bash
# Create environment files
touch .env.local .env.example

# Add environment variables
cat << EOF > .env.example
DATABASE_URL="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/Churnistic?retryWrites=true&w=majority"
NEXT_PUBLIC_FIREBASE_API_KEY=""
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=""
NEXT_PUBLIC_FIREBASE_PROJECT_ID=""
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=""
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=""
NEXT_PUBLIC_FIREBASE_APP_ID=""
EOF
```

Commit: `chore: add environment configuration`

### Afternoon Session (3 hours)

#### 6. Project Structure Setup

```bash
# Create directory structure
mkdir -p src/{components,lib,types,styles,server,utils,theme}
mkdir -p src/components/{ui,auth,layout,dashboard}
mkdir -p src/lib/{firebase,trpc,prisma}
mkdir -p src/server/{api,auth,db}

# Create base files
touch src/lib/firebase/config.ts
touch src/lib/firebase/auth.ts
touch src/lib/trpc/client.ts
touch src/lib/trpc/server.ts
touch src/types/index.ts
touch src/theme/theme.ts
touch src/theme/components.ts
touch src/theme/palette.ts
```

Commit: `feat: set up project directory structure with MUI theme configuration`

#### 7. Base Configuration Files

1. TypeScript Configuration

```typescript
// tsconfig.json additions
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

2. ESLint Configuration

```javascript
// .eslintrc.js
module.exports = {
  extends: ['next/core-web-vitals', 'prettier'],
  rules: {
    'no-unused-vars': 'error',
    'no-console': 'warn',
  },
};
```

3. Material UI Theme Setup

```typescript
// src/theme/theme.ts
import { createTheme } from '@mui/material/styles';
import { palette } from './palette';
import { components } from './components';

export const theme = createTheme({
  palette,
  components,
  // Add custom theme options here
});
```

Commit: `chore: configure TypeScript, ESLint, and MUI theme`

### Evening Session (2 hours)

#### 8. MongoDB Atlas Setup

1. Create cluster
2. Configure network access
3. Create database user
4. Get connection string
5. Initialize Prisma:

```bash
npx prisma init
```

#### 9. Initial Prisma Schema

```prisma
// prisma/schema.prisma
datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id            String    @id @default(auto()) @map("_id") @db.ObjectId
  firebaseUid   String    @unique
  email         String    @unique
  displayName   String?
  photoURL      String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

Commit: `feat: add initial Prisma schema with User model`

## End of Day Tasks

### 1. GitHub Setup

```bash
git remote add origin <repository-url>
git push -u origin main
```

### 2. Pull Request

```markdown
PR Title: Initial Project Setup

Description:
Sets up the foundational development environment:

- Next.js project initialization
- Development environment configuration
- Firebase project setup
- MongoDB Atlas configuration
- Base project structure
- Initial dependencies

Changes:

- Initialize Next.js with TypeScript
- Configure ESLint and Prettier
- Set up Firebase project
- Configure MongoDB Atlas
- Create initial schema
- Set up project structure

Testing Steps:

1. Clone repository
2. Copy .env.example to .env.local and fill values
3. Run npm install
4. Verify npm run dev works
5. Check database connection
6. Verify Firebase configuration

Dependencies Added:

- Next.js 14
- TypeScript
- Material UI
- tRPC
- Prisma
- Firebase
- Development tools

Infrastructure:

- MongoDB Atlas cluster
- Firebase project
- GitHub repository

Related Issues:
Closes #1 - Project Setup
```

## Day 1 Checklist

- [ ] Repository Setup
- [ ] Next.js Project
- [ ] Dependencies
- [ ] Firebase Project
- [ ] Environment Config
- [ ] Project Structure
- [ ] Base Configs
- [ ] MongoDB Setup
- [ ] Initial Schema
- [ ] Documentation

## Notes

- Keep track of all credentials and access tokens
- Document setup steps in README
- Verify all configurations work together
- Consider CI/CD setup for next day
