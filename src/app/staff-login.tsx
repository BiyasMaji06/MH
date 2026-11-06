import React, { useState } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../services/supabase';

const PINK = '#B23A63';

export default function StaffLoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [errorText, setErrorText] = useState('');

  const signIn = async () => {
    setErrorText('');
    if (!email.trim() || !password) { setErrorText('Enter your staff email and password.'); return; }
    setBusy(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (authError) throw authError;
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw userError || new Error('Could not verify the signed-in account.');
      const { data: staff, error: roleError } = await supabase
        .from('staff_users').select('role').eq('user_id', user.id).maybeSingle();
      if (roleError) throw roleError;
      if (staff?.role === 'admin') router.replace('/admin-dashboard' as any);
      else if (staff?.role === 'doctor') router.replace('/doctor-dashboard' as any);
      else {
        await supabase.auth.signOut();
        throw new Error('This account is not registered as an authorised MumWise staff account.');
      }
    } catch (e: any) {
      setErrorText(e?.message || 'Unable to sign in. Please try again.');
    } finally { setBusy(false); }
  };

  return <View style={s.page}>
    <View style={s.card}>
      <Text style={s.brand}>MumWise</Text>
      <Text style={s.title}>Staff Portal</Text>
      <Text style={s.subtitle}>Sign in with your authorised admin or doctor account.</Text>
      <Text style={s.label}>Email address</Text>
      <TextInput value={email} onChangeText={setEmail} placeholder="staff@example.com" autoCapitalize="none" keyboardType="email-address" autoComplete="email" style={s.input} />
      <Text style={s.label}>Password</Text>
      <TextInput value={password} onChangeText={setPassword} placeholder="Enter password" secureTextEntry autoComplete="password" style={s.input} onSubmitEditing={signIn} />
      {!!errorText && <Text style={s.error}>{errorText}</Text>}
      <TouchableOpacity style={[s.button, busy && { opacity: 0.7 }]} onPress={signIn} disabled={busy}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>Sign in to staff portal</Text>}
      </TouchableOpacity>
      <Text style={s.foot}>Access is restricted to accounts listed in the MumWise staff directory.</Text>
    </View>
  </View>;
}

const s = StyleSheet.create({ page: { flex: 1, minHeight: '100%' as any, backgroundColor: '#FFF5F8', alignItems: 'center', justifyContent: 'center', padding: 20 }, card: { width: '100%', maxWidth: 440, backgroundColor: '#fff', borderRadius: 22, padding: 30, borderWidth: 1, borderColor: '#F1D6E0', ...(Platform.OS === 'web' ? { boxShadow: '0 12px 36px rgba(90,35,58,0.08)' } as any : {}) }, brand: { color: PINK, fontSize: 15, fontWeight: '800', letterSpacing: 1 }, title: { color: '#512D3D', fontSize: 30, fontWeight: '800', marginTop: 10 }, subtitle: { color: '#8A6677', lineHeight: 21, marginTop: 8, marginBottom: 25 }, label: { color: '#512D3D', fontWeight: '700', marginBottom: 7, marginTop: 12 }, input: { borderWidth: 1, borderColor: '#EAD5DE', borderRadius: 11, padding: 13, color: '#512D3D', backgroundColor: '#FFFCFD', outlineStyle: 'none' as any }, button: { backgroundColor: PINK, borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 22, minHeight: 50, justifyContent: 'center' }, buttonText: { color: '#fff', fontWeight: '800' }, error: { color: '#B42318', marginTop: 12, lineHeight: 20 }, foot: { color: '#987C89', fontSize: 12, lineHeight: 18, marginTop: 20, textAlign: 'center' } });
