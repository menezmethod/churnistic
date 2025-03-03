import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  console.log('[user-role API] Request received');

  try {
    console.log('[user-role API] Creating Supabase client');
    const supabase = await createClient();

    // Get the token from the Authorization header
    const authHeader = request.headers.get('Authorization');
    console.log('[user-role API] Auth header exists:', !!authHeader);

    const token = authHeader?.split('Bearer ')[1];
    console.log('[user-role API] Token exists:', !!token);

    if (!token) {
      console.error('[user-role API] No token provided');
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    // Get user from token - using getUser for security
    console.log('[user-role API] Getting user from token');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    console.log('[user-role API] Auth result:', {
      userExists: !!user,
      userId: user?.id,
      error: authError?.message,
    });

    if (authError || !user) {
      console.error('[user-role API] Auth error or no user:', authError);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    console.log('[user-role API] User from auth:', user.id, user.email);
    console.log('[user-role API] User ID type:', typeof user.id);

    // Log the user object to see all available fields
    console.log('[user-role API] Full user object:', JSON.stringify(user, null, 2));

    // Get user profile with role - use eq for UUID compatibility
    console.log('[user-role API] Fetching user profile for ID:', user.id);
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    console.log('[user-role API] User profile query result:', {
      exists: !!userProfile,
      data: userProfile
        ? {
            id: userProfile.id,
            email: userProfile.email,
            role: userProfile.role,
          }
        : null,
      error: profileError?.message,
    });

    // If no profile exists yet, try to find by email with case insensitivity
    if (!userProfile && user.email) {
      console.log(
        '[user-role API] No profile found by ID, trying to find by email with case insensitivity:',
        user.email
      );

      // Try using ilike for case-insensitive matching
      const { data: emailProfile, error: emailError } = await supabase
        .from('users')
        .select('*')
        .ilike('email', user.email)
        .maybeSingle();

      console.log('[user-role API] Case-insensitive email profile query result:', {
        exists: !!emailProfile,
        data: emailProfile
          ? {
              id: emailProfile.id,
              email: emailProfile.email,
              role: emailProfile.role,
            }
          : null,
        error: emailError?.message,
      });

      // If we found a profile by email, update its ID to match the auth user
      if (emailProfile) {
        console.log(
          '[user-role API] Found profile by email, updating ID to match auth user'
        );

        // Update the existing profile with the new ID
        const { data: updatedProfile, error: updateError } = await supabase
          .from('users')
          .update({ id: user.id })
          .eq('id', emailProfile.id) // Use the existing profile ID for update condition
          .select()
          .single();

        console.log('[user-role API] Profile ID update result:', {
          success: !!updatedProfile,
          data: updatedProfile
            ? {
                id: updatedProfile.id,
                email: updatedProfile.email,
                role: updatedProfile.role,
              }
            : null,
          error: updateError?.message,
        });

        if (updateError) {
          console.error('[user-role API] Error updating profile ID:', updateError);

          // Just return the role from the existing profile
          console.log(
            '[user-role API] Falling back to returning role from existing profile:',
            emailProfile.role
          );
          return NextResponse.json({
            role: emailProfile.role || 'user',
            permissions: [],
          });
        } else if (updatedProfile) {
          console.log(
            '[user-role API] Successfully updated profile ID, returning role:',
            updatedProfile.role
          );
          return NextResponse.json({
            role: updatedProfile.role || 'user',
            permissions: [],
          });
        }
      }

      // If no profile was found by ID or email, we need to attempt a force create
      try {
        console.log(
          '[user-role API] No profile found, attempting force create for:',
          user.id
        );

        // First, try to delete any conflicting records (only in development)
        if (process.env.NODE_ENV === 'development') {
          console.log(
            '[user-role API] In development: attempting to remove conflicting records'
          );

          // Try to find any user with the exact same email using direct SQL
          const { data: existingUsers } = await supabase
            .from('users')
            .select('id, email, role')
            .eq('email', user.email || '');

          console.log('[user-role API] Existing users with same email:', existingUsers);

          if (existingUsers && existingUsers.length > 0) {
            // Found existing user with same email - let's use that role instead of creating a new one
            const existingUser = existingUsers[0];
            console.log(
              '[user-role API] Found existing user with same email, using their role:',
              existingUser.role
            );

            return NextResponse.json({
              role: existingUser.role || 'user',
              permissions: [],
              source: 'existing_email_user',
              id: existingUser.id,
            });
          }
        }

        // Create a new user profile with properly formatted data
        const userData = {
          id: user.id,
          email: user.email || '',
          role: 'user',
          display_name:
            user.user_metadata?.name ||
            user.user_metadata?.full_name ||
            (user.email ? user.email.split('@')[0] : 'User'),
          avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        console.log('[user-role API] Attempting to create user with data:', userData);

        // Use the upsert method with onConflict which handles UUID properly
        const { data: newProfile, error: insertError } = await supabase
          .from('users')
          .upsert([userData], {
            onConflict: 'id',
            ignoreDuplicates: false,
          })
          .select()
          .maybeSingle();

        console.log('[user-role API] User profile creation result:', {
          success: !!newProfile,
          data: newProfile
            ? {
                id: newProfile.id,
                email: newProfile.email,
                role: newProfile.role,
              }
            : null,
          error: insertError?.message,
          errorDetails: insertError,
        });

        if (insertError) {
          console.error('[user-role API] Error creating user profile:', insertError);

          // Check if it's a duplicate key error - might be email uniqueness constraint
          if (
            insertError.message?.includes('duplicate key') &&
            insertError.message?.includes('users_email_key')
          ) {
            console.log(
              '[user-role API] Duplicate email detected, attempting to find existing user'
            );

            // Get the user with the matching email
            const { data: existingUser } = await supabase
              .from('users')
              .select('id, email, role')
              .eq('email', user.email || '')
              .maybeSingle();

            if (existingUser) {
              console.log(
                '[user-role API] Found existing user with email:',
                existingUser
              );
              return NextResponse.json({
                role: existingUser.role || 'user',
                permissions: [],
                source: 'existing_email_user',
                id: existingUser.id,
              });
            }
          }

          // Return a default response rather than failing
          return NextResponse.json({
            role: 'user',
            permissions: [],
          });
        }

        // Return the newly created profile's role
        console.log(
          '[user-role API] Returning newly created profile role:',
          newProfile?.role || 'user'
        );
        return NextResponse.json({
          role: newProfile?.role || 'user',
          permissions: [],
        });
      } catch (createError) {
        console.error('[user-role API] Error in force create attempt:', createError);
        return NextResponse.json({
          role: 'user',
          permissions: [],
        });
      }
    }

    // Return the existing user's role
    console.log(
      '[user-role API] Returning existing profile role:',
      userProfile.role || 'user'
    );
    return NextResponse.json({
      role: userProfile.role || 'user',
      permissions: [],
    });
  } catch (error) {
    console.error('[user-role API] Error in user-role route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
