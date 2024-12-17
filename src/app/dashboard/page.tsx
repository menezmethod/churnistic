'use client';

import { withAuth } from '@/components/auth/withAuth';
import { Permission } from '@/types/auth';

function DashboardPage(): JSX.Element {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card Management Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Card Management</h2>
          <p className="text-gray-600 mb-4">
            Track and manage your credit card applications and rewards.
          </p>
          <button className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark transition-colors">
            View Cards
          </button>
        </div>

        {/* Rewards Tracking Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Rewards Tracking</h2>
          <p className="text-gray-600 mb-4">
            Monitor your points, miles, and cashback across all cards.
          </p>
          <button className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark transition-colors">
            View Rewards
          </button>
        </div>

        {/* Application Status Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Application Status</h2>
          <p className="text-gray-600 mb-4">
            Check the status of your pending card applications.
          </p>
          <button className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark transition-colors">
            View Status
          </button>
        </div>
      </div>
    </div>
  );
}

// Protect the dashboard with required permissions
export default withAuth(DashboardPage, {
  requiredPermissions: [Permission.READ_CARDS],
});
