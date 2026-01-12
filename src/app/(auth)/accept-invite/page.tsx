import { Suspense } from 'react';
import { AcceptInviteForm } from '@/components/auth/accept-invite-form';

export const metadata = {
  title: 'მოწვევის მიღება',
};

export default function AcceptInvitePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500 text-white font-bold text-xl shadow-lg shadow-blue-500/30">
            G
          </div>
          <h1 className="text-2xl font-bold text-gray-900">GeoAdmin</h1>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <Suspense fallback={<div className="h-48 animate-pulse bg-gray-100 rounded-lg" />}>
            <AcceptInviteForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
