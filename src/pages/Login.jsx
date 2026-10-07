import React from 'react';
import LoginForm from '../components/Auth/Login';

/**
 * Public Login Page
 * Dedicated login route page
 */
export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <LoginForm />
      </main>
    </div>
  );
}
