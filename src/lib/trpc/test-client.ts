import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@/server/routers/_app';
import { getUrl } from './client';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

// Create test client
const client = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: getUrl(),
      async headers() {
        const currentUser = getAuth().currentUser;
        if (currentUser) {
          const token = await currentUser.getIdToken();
          return {
            authorization: `Bearer ${token}`,
          };
        }
        return {};
      },
    }),
  ],
});

async function testEndpoints() {
  try {
    // Test public procedure (user creation)
    console.log('\n🔍 Testing user creation...');
    const newUser = await client.user.create.mutate({
      firebaseUid: 'test-uid-123',
      email: 'test@example.com',
      displayName: 'Test User',
    });
    console.log('✅ User created:', newUser);

    // Test protected procedure (company creation) without auth
    console.log('\n🔍 Testing company creation without auth (should fail)...');
    try {
      await client.company.create.mutate({
        name: 'Test Company',
        industry: 'Technology',
        size: '1-10',
        website: 'https://test.com',
      });
    } catch (error) {
      console.log('✅ Protected route correctly rejected unauthorized access:', error.message);
    }

    // Sign in with test credentials
    console.log('\n🔍 Testing authentication...');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, 'test@example.com', 'testpassword123');
      console.log('✅ Authentication successful:', userCredential.user.uid);

      // Test protected procedure (company creation) with auth
      console.log('\n🔍 Testing company creation with auth...');
      const newCompany = await client.company.create.mutate({
        name: 'Test Company',
        industry: 'Technology',
        size: '1-10',
        website: 'https://test.com',
      });
      console.log('✅ Company created:', newCompany);
    } catch (error) {
      console.log('❌ Authentication failed:', error.message);
    }

    console.log('\n✅ Test completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the tests
testEndpoints(); 