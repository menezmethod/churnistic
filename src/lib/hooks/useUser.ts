import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  limit,
  orderBy,
} from 'firebase/firestore';

import { auth } from '@/lib/firebase/client-app';
import { db } from '@/lib/firebase/config';
import { UserRole } from '@/types/roles';

interface UserResponse {
  id: string;
  email: string;
  displayName: string | null;
  role: UserRole;
  isSuperAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UpdateUserInput {
  id: string;
  displayName?: string;
  email?: string;
}

async function fetchCurrentUser(): Promise<UserResponse> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Not authenticated');
  }

  const userDoc = await getDoc(doc(db, 'users', user.uid));
  if (!userDoc.exists()) {
    throw new Error('User not found');
  }

  const data = userDoc.data();
  return {
    id: userDoc.id,
    email: data.email,
    displayName: data.displayName,
    role: data.role,
    isSuperAdmin: data.isSuperAdmin ?? false,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

async function fetchUserById(id: string): Promise<UserResponse> {
  const userDoc = await getDoc(doc(db, 'users', id));
  if (!userDoc.exists()) {
    throw new Error('User not found');
  }

  const data = userDoc.data();
  return {
    id: userDoc.id,
    email: data.email,
    displayName: data.displayName,
    role: data.role,
    isSuperAdmin: data.isSuperAdmin ?? false,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

async function updateUser({ id, ...data }: UpdateUserInput): Promise<UserResponse> {
  const userRef = doc(db, 'users', id);
  const userDoc = await getDoc(userRef);
  if (!userDoc.exists()) {
    throw new Error('User not found');
  }

  const updateData = {
    ...data,
    updatedAt: new Date().toISOString(),
  };

  await updateDoc(userRef, updateData);

  const updatedDoc = await getDoc(userRef);
  const updatedData = updatedDoc.data();

  if (!updatedData) {
    throw new Error('Failed to get updated user data');
  }

  return {
    id: updatedDoc.id,
    email: updatedData.email,
    displayName: updatedData.displayName,
    role: updatedData.role,
    isSuperAdmin: updatedData.isSuperAdmin ?? false,
    createdAt: updatedData.createdAt,
    updatedAt: updatedData.updatedAt,
  };
}

async function deleteUser(id: string): Promise<UserResponse> {
  const userRef = doc(db, 'users', id);
  const userDoc = await getDoc(userRef);
  if (!userDoc.exists()) {
    throw new Error('User not found');
  }

  const userData = userDoc.data();
  await deleteDoc(userRef);

  return {
    id: userDoc.id,
    email: userData.email,
    displayName: userData.displayName,
    role: userData.role,
    isSuperAdmin: userData.isSuperAdmin ?? false,
    createdAt: userData.createdAt,
    updatedAt: userData.updatedAt,
  };
}

async function fetchUsers(params?: {
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<UserResponse[]> {
  const usersRef = collection(db, 'users');
  let q = query(usersRef);

  if (params?.search) {
    q = query(
      q,
      where('displayName', '>=', params.search),
      where('displayName', '<=', params.search + '\uf8ff')
    );
  }

  if (params?.limit) {
    q = query(q, limit(params.limit));
  }

  q = query(q, orderBy('createdAt', 'desc'));

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      email: data.email,
      displayName: data.displayName,
      role: data.role,
      isSuperAdmin: data.isSuperAdmin ?? false,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ['users', 'me'],
    queryFn: fetchCurrentUser,
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => fetchUserById(id),
  });
}

export function useUsers(params?: { search?: string; limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => fetchUsers(params),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUser,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.setQueryData(['users', data.id], data);
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteUser,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.removeQueries({ queryKey: ['users', data.id] });
    },
  });
}
