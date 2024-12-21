'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Permission } from '@/lib/auth/types';

function CardsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-semibold text-gray-900 mb-4">Credit Cards</h1>
            <div className="border-t border-gray-200 pt-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Placeholder Card */}
                <div className="bg-white overflow-hidden shadow rounded-lg border">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium text-gray-900">Coming Soon</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Credit card recommendations and tracking will be available soon.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProtectedCardsPage() {
  return (
    <ProtectedRoute requiredPermissions={[Permission.READ_CARDS]} redirectTo="/login">
      <CardsPage />
    </ProtectedRoute>
  );
}
