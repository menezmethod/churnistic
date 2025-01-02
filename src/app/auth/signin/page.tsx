import type { JSX } from 'react';

import { SignIn } from '../components/SignIn';

export const metadata = {
  title: 'Sign In - Churnistic',
  description: 'Sign in to your Churnistic account',
};

export default function SignInPage(): JSX.Element {
  return <SignIn />;
}
