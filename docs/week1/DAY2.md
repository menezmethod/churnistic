# Day 2: Authentication & Core Models (Tuesday)

## Overview
Focus on implementing Firebase authentication and setting up core data models.

## Session Plan

### Morning Session (3 hours)
#### 1. Firebase Configuration
```typescript
// src/lib/firebase/config.ts
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

export const initFirebase = () => {
  if (!getApps().length) {
    const app = initializeApp(firebaseConfig);
    return app;
  }
  return getApps()[0];
};

export const auth = getAuth(initFirebase());
```

Commit: `feat: add Firebase configuration and initialization`

#### 2. Auth Context Setup
```typescript
// src/lib/firebase/auth-context.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from './config';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

Commit: `feat: add Firebase auth context and provider`

### Mid-Morning Session (2 hours)
#### 3. Protected Route Middleware
```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/firebase/admin';

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('session')?.value;

  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    await auth.verifySessionCookie(session, true);
    return NextResponse.next();
  } catch (error) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/settings/:path*']
};
```

Commit: `feat: add protected route middleware`

#### 4. Firebase Admin Setup
```typescript
// src/lib/firebase/admin.ts
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  });
}

export const auth = admin.auth();
```

Commit: `feat: add Firebase Admin SDK configuration`

### Afternoon Session (3 hours)
#### 5. Core Data Models
```prisma
// prisma/schema.prisma
model Customer {
  id            String    @id @default(auto()) @map("_id") @db.ObjectId
  name          String
  email         String    @unique
  company       String
  industry      String
  status        String    @default("active")
  riskScore     Float     @default(0)
  activities    Activity[]
  churnRisk     ChurnRisk?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Activity {
  id          String    @id @default(auto()) @map("_id") @db.ObjectId
  customerId  String    @db.ObjectId
  customer    Customer  @relation(fields: [customerId], references: [id])
  type        String
  metadata    Json
  timestamp   DateTime  @default(now())
}

model ChurnRisk {
  id          String    @id @default(auto()) @map("_id") @db.ObjectId
  customerId  String    @db.ObjectId @unique
  customer    Customer  @relation(fields: [customerId], references: [id])
  score       Float
  indicators  Json
  trend       String
  lastUpdated DateTime  @default(now())
}
```

Commit: `feat: add core data models for customer and activity tracking`

#### 6. Authentication Components
```typescript
// src/components/auth/login-form.tsx
import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Handle successful login
    } catch (error) {
      // Handle error
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form implementation */}
    </form>
  );
}
```

Commit: `feat: add authentication form components`

### Evening Session (2 hours)
#### 7. Session Management
```typescript
// src/app/api/auth/session/route.ts
import { auth } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await auth.createSessionCookie(token, { expiresIn });
    
    cookies().set('session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: true
    });

    return new Response(JSON.stringify({ status: 'success' }), {
      status: 200
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401
    });
  }
}
```

Commit: `feat: add session management API routes`

## Pull Requests

### PR #2: Firebase Authentication System
```markdown
PR Title: feat: Firebase Authentication System

Description:
Implements complete Firebase authentication system including:
- Firebase initialization and configuration
- Auth context and hooks
- Protected route middleware
- Login/Register components
- Session management
- Firebase Admin SDK setup

Changes:
- Add Firebase configuration and initialization
- Create AuthContext and useAuth hook
- Implement protected route middleware
- Add authentication components
- Set up Firebase Admin SDK
- Add session management API routes
- Update environment variables

Testing Steps:
1. Configure Firebase credentials in .env.local
2. Start development server
3. Test login flow:
   - Visit /login
   - Attempt login with valid credentials
   - Verify redirect to dashboard
4. Test protection:
   - Try accessing /dashboard without auth
   - Verify redirect to login
5. Test session persistence:
   - Login and close browser
   - Reopen and verify session maintained

Security Considerations:
- Secure session cookie settings
- Protected route implementation
- Error handling
- Token validation

Related Issues:
Closes #2 - Authentication System Implementation
```

### PR #3: Core Data Models
```markdown
PR Title: feat: Core Data Models and Database Schema

Description:
Implements the core data models for the application:
- Customer model with risk tracking
- Activity logging system
- Churn risk assessment model

Changes:
- Add Prisma schema for core models
- Create database migrations
- Add type definitions
- Set up model relationships
- Add indexes for performance

Testing Steps:
1. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```
2. Verify model creation:
   ```bash
   npx prisma studio
   ```
3. Test model relationships:
   - Create test customer
   - Add activity
   - Verify relationships

Database Changes:
- New Customer collection
- New Activity collection
- New ChurnRisk collection
- Indexes on frequently queried fields

Related Issues:
Closes #3 - Core Data Models Implementation
```

## Day 2 Checklist
- [ ] Firebase Configuration
- [ ] Auth Context Setup
- [ ] Protected Routes
- [ ] Firebase Admin SDK
- [ ] Core Data Models
- [ ] Auth Components
- [ ] Session Management
- [ ] Testing & Documentation

## Notes
- Test all authentication flows thoroughly
- Document security considerations
- Verify database indexes
- Plan for user management features 