import React from 'react';
import Navbar from '../components/Navbar';
import LoginForm from '../components/Auth/Login';

/**
 * Public Login Page
 * Dedicated login route page
 */
export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <LoginForm />
      </main>
    </div>
  );
}
