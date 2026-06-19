import { createClient } from '@supabase/supabase-js';

// Normalizes the Supabase URL so it doesn't have trailing slashes or subpaths like rest/v1
export const normalizeSupaUrl = (rawUrl: string): string => {
  let u = rawUrl.trim();
  while (u.endsWith('/')) u = u.slice(0, -1);
  if (u.endsWith('/rest/v1')) u = u.slice(0, -8);
  else if (u.endsWith('rest/v1')) u = u.slice(0, -7);
  while (u.endsWith('/')) u = u.slice(0, -1);
  return u;
};

// Gets or instantiates a Supabase standard client
export const getSupabaseClient = (url: string, anonKey: string) => {
  const cleanUrl = normalizeSupaUrl(url);
  return createClient(cleanUrl, anonKey.trim());
};

export interface UserProfile {
  id: string;
  email: string;
  credits: number;
}

/**
 * Ensures user profile exists in public.profiles table or returns default
 */
export const getOrCreateProfile = async (
  supabase: any,
  userId: string,
  email: string
): Promise<UserProfile> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // Profile does not exist - let's create it
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert([{ id: userId, email, credits: 10 }]) // 10 starter credits
        .select()
        .single();

      if (!createError && newProfile) {
        return newProfile as any as UserProfile;
      }
    }

    if (data) {
      return data as any as UserProfile;
    }
  } catch (err) {
    console.warn('Profiles table may not exist. Falling back to metadata / local storage balance.', err);
  }

  // Fallback if profiles table is not set up
  return { id: userId, email, credits: 10 };
};

/**
 * Redeems an active key
 * Updates active_keys and adds credits to user profiles
 */
export const redeemKeyCode = async (
  supabase: any,
  keyCode: string,
  user: { id: string; email: string; currentCredits: number }
): Promise<{ success: boolean; redeemedCredits: number; message: string }> => {
  const cleanKey = keyCode.trim();
  if (!cleanKey) {
    return { success: false, redeemedCredits: 0, message: 'يرجى كتابة الكود أولاً.' };
  }

  // 1. Search the active_keys table for key_code
  const { data: keyRecords, error: seekError } = await supabase
    .from('active_keys')
    .select('*')
    .eq('key_code', cleanKey);

  if (seekError) {
    console.error('Error finding active key:', seekError);
    return { success: false, redeemedCredits: 0, message: 'فشل الفحص بالسحابة، يرجى التحقق من اتصال قاعدة البيانات.' };
  }

  if (!keyRecords || keyRecords.length === 0) {
    return { success: false, redeemedCredits: 0, message: 'كود التفعيل غير صالح (الكود غير موجود).' };
  }

  const keyRecord = keyRecords[0];

  // 2. If used = true, show already used
  if (keyRecord.used) {
    return { success: false, redeemedCredits: 0, message: 'هذا الكود تم استخدامه مسبقاً بالفعل.' };
  }

  const creditsToAdd = Number(keyRecord.credits) || 0;
  if (creditsToAdd <= 0) {
    return { success: false, redeemedCredits: 0, message: 'هذا الكود لا يحتوي على رصيد متاح لتبييته.' };
  }

  // 3. Update the key state in active_keys
  // set used = true, email = current user's email, timestamp = current timestamp
  const nowStr = new Date().toISOString();
  const { error: updateKeyError } = await supabase
    .from('active_keys')
    .update({
      used: true,
      email: user.email,
      created_at: nowStr // save current timestamp
    })
    .eq('id', keyRecord.id);

  if (updateKeyError) {
    console.error('Error updating key state:', updateKeyError);
    return { success: false, redeemedCredits: 0, message: 'فشل تحديث حالة الكود في قاعدة البيانات.' };
  }

  // 4. Update those credits in user's account balance
  const nextCreditsAmount = user.currentCredits + creditsToAdd;

  try {
    const { error: updateProfileError } = await supabase
      .from('profiles')
      .update({ credits: nextCreditsAmount })
      .eq('id', user.id);

    if (updateProfileError) {
      console.warn('Failed to update profiles table. Trying user Auth meta data update as fallback.', updateProfileError);
    }
  } catch (err) {
    // Graceful fallback
  }

  // Also try to update user auth metadata so it is saved directly on the user login object
  try {
    await supabase.auth.updateUser({
      data: { credits: nextCreditsAmount }
    });
  } catch (err) {
    // Clean escape
  }

  return {
    success: true,
    redeemedCredits: creditsToAdd,
    message: `رائع! تم تفعيل الكود بنجاح وإضافة ${creditsToAdd} محاولة إلى رصيدك.`
  };
};
