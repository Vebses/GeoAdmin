import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/login-form';

export const metadata = {
  title: 'შესვლა',
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500 text-white font-bold text-xl shadow-lg shadow-blue-500/30">
            G
          </div>
          <h1 className="text-2xl font-bold text-gray-900">GeoAdmin</h1>
          <p className="mt-1 text-sm text-gray-500">
            სამედიცინო დახმარების მართვის სისტემა
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">შესვლა</h2>
            <p className="text-sm text-gray-500">
              შეიყვანეთ თქვენი მონაცემები
            </p>
          </div>

          <Suspense fallback={<div className="h-48 animate-pulse bg-gray-100 rounded-lg" />}>
            <LoginForm />
          </Suspense>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} GeoAdmin. ყველა უფლება დაცულია.
        </p>
      </div>
    </div>
  );
}
