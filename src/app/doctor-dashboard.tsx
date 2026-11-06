import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../services/supabase';

const PINK = '#B23A63';
type Assignment = { id: string; question_id: string; doctor_id: string; status: string; assigned_at: string; unanswered_questions: any };

export default function DoctorDashboard() {
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState('');
  const [doctorName, setDoctorName] = useState('Doctor');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) { router.replace('/staff-login' as any); return; }
      const { data: staff, error: staffError } = await supabase.from('staff_users').select('role,display_name').eq('user_id', user.id).maybeSingle();
      if (staffError || staff?.role !== 'doctor') { await supabase.auth.signOut(); router.replace('/staff-login' as any); return; }
      setDoctorName(staff.display_name || 'Doctor');
      const { data, error } = await supabase.from('doctor_assignments')
        .select('id,question_id,doctor_id,status,assigned_at,unanswered_questions(question,status)')
        .eq('doctor_id', user.id).in('status', ['assigned','in_progress']).order('assigned_at', { ascending: false });
      if (error) throw error;
      setAssignments((data || []) as unknown as Assignment[]);
    } catch (e: any) { Alert.alert('Could not load assignments', e?.message || 'Please try again.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = async (assignment: Assignment) => {
    const response = (answers[assignment.id] || '').trim();
    if (!response) { Alert.alert('Response required', 'Write your response before submitting.'); return; }
    setBusyId(assignment.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Your session has expired. Please sign in again.');
      const { error: insertError } = await supabase.from('doctor_responses').insert({ question_id: assignment.question_id, doctor_id: user.id, response, status: 'submitted' });
      if (insertError) throw insertError;
      const { error: assignmentError } = await supabase.from('doctor_assignments').update({ status: 'completed' }).eq('id', assignment.id).eq('doctor_id', user.id);
      if (assignmentError) throw assignmentError;
      const { error: questionError } = await supabase.from('unanswered_questions').update({ status: 'awaiting_doctor', updated_at: new Date().toISOString() }).eq('id', assignment.question_id);
      if (questionError) console.warn('Question status update:', questionError.message);
      setAnswers(p => ({ ...p, [assignment.id]: '' }));
      Alert.alert('Response submitted', 'Your response has been sent to the admin for review. It will not be shown by SIA until approved.');
      await load();
    } catch (e: any) { Alert.alert('Submission failed', e?.message || 'Please try again.'); }
    finally { setBusyId(''); }
  };

  const logout = async () => { await supabase.auth.signOut(); router.replace('/staff-login' as any); };
  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={PINK} /><Text style={s.muted}>Loading your assignments…</Text></View>;
  return <View style={s.page}><ScrollView contentContainerStyle={s.content}>
    <View style={s.top}><View><Text style={s.brand}>MumWise · STAFF</Text><Text style={s.title}>Doctor Dashboard</Text><Text style={s.muted}>Welcome, {doctorName}</Text></View><TouchableOpacity onPress={logout} style={s.logout}><Text style={s.logoutText}>Sign out</Text></TouchableOpacity></View>
    <View style={s.notice}><Text style={s.noticeTitle}>Clinical review workspace</Text><Text style={s.muted}>Please provide a considered response based on your professional judgement. Admin approval is required before a response becomes an SIA FAQ.</Text></View>
    <Text style={s.sectionTitle}>Your assigned questions ({assignments.length})</Text>
    {assignments.length === 0 ? <View style={s.card}><Text style={s.muted}>You have no active assigned questions.</Text></View> : assignments.map(a => {
      const linked = Array.isArray(a.unanswered_questions) ? a.unanswered_questions[0] : a.unanswered_questions;
      return <View key={a.id} style={s.card}><Text style={s.question}>{linked?.question || `Question ${a.question_id}`}</Text><Text style={s.meta}>Assignment status: {a.status} · {new Date(a.assigned_at).toLocaleString()}</Text><TextInput value={answers[a.id] || ''} onChangeText={v => setAnswers(p => ({ ...p, [a.id]: v }))} placeholder="Write your response for admin review…" multiline style={s.input} /><TouchableOpacity style={s.primary} disabled={busyId === a.id} onPress={() => submit(a)}><Text style={s.primaryText}>{busyId === a.id ? 'Submitting…' : 'Submit response for approval'}</Text></TouchableOpacity></View>;
    })}
    <TouchableOpacity onPress={load} style={s.refresh}><Text style={s.secondaryText}>Refresh assignments</Text></TouchableOpacity>
  </ScrollView></View>;
}

const s = StyleSheet.create({ page: { flex: 1, minHeight: '100%' as any, backgroundColor: '#FFF7FA' }, content: { width: '100%', maxWidth: 1000, alignSelf: 'center', padding: 24, paddingBottom: 60 }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF7FA' }, top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }, brand: { color: PINK, fontWeight: '900', letterSpacing: 1, fontSize: 12 }, title: { fontSize: 30, fontWeight: '900', color: '#512D3D', marginTop: 5 }, muted: { color: '#8A6677', fontSize: 13, lineHeight: 20, marginTop: 4 }, logout: { borderWidth: 1, borderColor: '#E8C8D5', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 15 }, logoutText: { color: PINK, fontWeight: '800' }, notice: { backgroundColor: '#FCEAF1', borderRadius: 15, padding: 18, marginBottom: 22 }, noticeTitle: { color: '#512D3D', fontSize: 16, fontWeight: '900' }, sectionTitle: { color: '#512D3D', fontSize: 20, fontWeight: '900', marginBottom: 12 }, card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#F0DCE4', borderRadius: 16, padding: 19, marginBottom: 14 }, question: { color: '#512D3D', fontSize: 16, fontWeight: '800', lineHeight: 24 }, meta: { color: '#967C89', fontSize: 12, marginTop: 8 }, input: { borderWidth: 1, borderColor: '#EAD5DE', borderRadius: 10, padding: 13, marginTop: 15, minHeight: 130, textAlignVertical: 'top', color: '#512D3D', backgroundColor: '#FFFCFD' }, primary: { backgroundColor: PINK, borderRadius: 10, padding: 13, alignItems: 'center', marginTop: 12, alignSelf: 'flex-start' }, primaryText: { color: '#fff', fontWeight: '800' }, refresh: { alignSelf: 'center', padding: 15 }, secondaryText: { color: PINK, fontWeight: '800' } });
