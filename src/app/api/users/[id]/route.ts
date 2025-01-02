import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/lib/firebase/admin';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const userDoc = await db.collection('users').doc(params.id).get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    const user = {
      id: userDoc.id,
      email: userData?.email,
      displayName: userData?.displayName,
      photoURL: userData?.photoURL,
      role: userData?.role,
      status: userData?.status,
      createdAt: userData?.createdAt,
      updatedAt: userData?.updatedAt,
    };

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const data = await request.json();
    const userRef = db.collection('users').doc(params.id);

    // Update the user document
    await userRef.update({
      ...data,
      updatedAt: new Date().toISOString(),
    });

    // Get the updated user data
    const userDoc = await userRef.get();
    const userData = userDoc.data();

    const user = {
      id: userDoc.id,
      email: userData?.email,
      displayName: userData?.displayName,
      photoURL: userData?.photoURL,
      role: userData?.role,
      status: userData?.status,
      createdAt: userData?.createdAt,
      updatedAt: userData?.updatedAt,
    };

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    await db.collection('users').doc(params.id).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
