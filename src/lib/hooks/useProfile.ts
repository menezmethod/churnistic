'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';

import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { DatabaseUser, mapDatabaseUserToUser } from '@/types/user';

interface ProfileData {
  displayName: string;
  avatarUrl: string | null;
  bio?: string;
  phone?: string;
  location?: string;
  website?: string;
}

export function useProfile() {
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Fetch the user profile
  const {
    data: profile,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['profile', authUser?.id],
    queryFn: async () => {
      if (!authUser?.id) {
        throw new Error('User not authenticated');
      }

      // First, check if the profile exists
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        // PGRST116 means "no rows returned" - valid for new users
        console.error('Error fetching profile:', profileError);
        throw new Error(`Failed to fetch profile: ${profileError.message}`);
      }

      // If profile doesn't exist, check the users table
      if (!profileData) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (userError) {
          console.error('Error fetching user:', userError);
          throw new Error(`Failed to fetch user: ${userError.message}`);
        }

        return userData ? mapDatabaseUserToUser(userData as DatabaseUser) : null;
      }

      return profileData;
    },
    enabled: !!authUser?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<ProfileData>) => {
      if (!authUser?.id) {
        throw new Error('User not authenticated');
      }

      // First, check if profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', authUser.id)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking profile existence:', checkError);
        throw new Error(`Failed to check profile: ${checkError.message}`);
      }

      // Prepare the data for database
      const dbFields: Partial<ProfileData> & { updated_at: string } = {
        displayName: data.displayName,
        avatarUrl: data.avatarUrl,
        bio: data.bio,
        phone: data.phone,
        location: data.location,
        website: data.website,
        updated_at: new Date().toISOString(),
      };

      // Filter out undefined values
      Object.keys(dbFields).forEach((key) => {
        if (key in dbFields && dbFields[key as keyof typeof dbFields] === undefined) {
          delete dbFields[key as keyof typeof dbFields];
        }
      });

      // If profile exists, update it
      if (existingProfile) {
        const { data: updatedProfile, error: updateError } = await supabase
          .from('profiles')
          .update(dbFields)
          .eq('id', authUser.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating profile:', updateError);
          throw new Error(`Failed to update profile: ${updateError.message}`);
        }

        return updatedProfile;
      }
      // If not, insert a new profile
      else {
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert([{ id: authUser.id, ...dbFields }])
          .select()
          .single();

        if (insertError) {
          console.error('Error creating profile:', insertError);
          throw new Error(`Failed to create profile: ${insertError.message}`);
        }

        return newProfile;
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['profile', authUser?.id], data);
      // Also update the user data if it's affected
      queryClient.invalidateQueries({ queryKey: ['user', authUser?.id] });
    },
  });

  // Upload avatar mutation
  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!authUser?.id) {
        throw new Error('User not authenticated');
      }

      setIsUploading(true);
      setUploadProgress(0);
      setUploadError(null);

      try {
        // Generate a unique file name
        const fileExt = file.name.split('.').pop();
        const filePath = `avatars/${authUser.id}/${Date.now()}.${fileExt}`;

        // Upload the file to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('profiles')
          .upload(filePath, file, {
            upsert: true,
            onUploadProgress: (progress: {
              uploadedBytes: number;
              totalBytes: number;
            }) => {
              const percent = (progress.uploadedBytes / progress.totalBytes) * 100;
              setUploadProgress(Math.round(percent));
            },
          });

        if (uploadError) {
          setUploadError(uploadError.message);
          throw new Error(`Failed to upload avatar: ${uploadError.message}`);
        }

        // Get the public URL for the uploaded file
        const {
          data: { publicUrl },
        } = supabase.storage.from('profiles').getPublicUrl(uploadData.path);

        // Update the profile with the new avatar URL
        return await updateProfileMutation.mutateAsync({ avatarUrl: publicUrl });
      } finally {
        setIsUploading(false);
      }
    },
    onError: (error) => {
      setUploadError(
        error instanceof Error ? error.message : 'Unknown error during upload'
      );
    },
  });

  // Delete avatar
  const deleteAvatarMutation = useMutation({
    mutationFn: async () => {
      if (!authUser?.id || !profile?.avatarUrl) {
        throw new Error('No avatar to delete or user not authenticated');
      }

      // Extract the path from the URL
      const url = new URL(profile.avatarUrl);
      const path = url.pathname.split('/').slice(2).join('/');

      // Delete the file from storage
      const { error: deleteError } = await supabase.storage
        .from('profiles')
        .remove([path]);

      if (deleteError) {
        throw new Error(`Failed to delete avatar: ${deleteError.message}`);
      }

      // Update the profile to remove the avatar URL
      return await updateProfileMutation.mutateAsync({ avatarUrl: null });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', authUser?.id] });
    },
  });

  // Update profile convenience function
  const updateProfile = useCallback(
    (data: Partial<ProfileData>) => updateProfileMutation.mutateAsync(data),
    [updateProfileMutation]
  );

  // Upload avatar convenience function
  const uploadAvatar = useCallback(
    (file: File) => uploadAvatarMutation.mutateAsync(file),
    [uploadAvatarMutation]
  );

  // Delete avatar convenience function
  const deleteAvatar = useCallback(
    () => deleteAvatarMutation.mutateAsync(),
    [deleteAvatarMutation]
  );

  return {
    profile,
    isLoading,
    isError,
    error,
    refetch,
    updateProfile,
    updateProfileStatus: {
      isLoading: updateProfileMutation.isPending,
      isSuccess: updateProfileMutation.isSuccess,
      isError: updateProfileMutation.isError,
      error: updateProfileMutation.error,
    },
    uploadAvatar,
    deleteAvatar,
    avatarStatus: {
      isUploading,
      uploadProgress,
      uploadError,
      isDeleting: deleteAvatarMutation.isPending,
      deleteError: deleteAvatarMutation.error,
    },
  };
}
