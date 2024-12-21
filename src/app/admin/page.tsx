'use client';

import { collection, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { UserRole } from '@/lib/auth/types';
import { db } from '@/lib/firebase/config';

interface User {
  id: string;
  email: string;
  role: UserRole;
  displayName?: string;
}

function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    void fetchUsers();
  }, []);

  return (
    <ProtectedRoute requiredRole={UserRole.ADMIN}>
      <div>
        <h1>Admin Dashboard</h1>
        <div>
          <h2>Users</h2>
          <ul>
            {users.map((user) => (
              <li key={user.id}>
                {user.displayName || user.email} - {user.role}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default AdminPage;
