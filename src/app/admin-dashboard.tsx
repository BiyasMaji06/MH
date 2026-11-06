import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../services/supabase';

const PINK = '#B23A63';
type Question = { id: string; question: string; status: string; created_at: string; category_id: string | null };
type Doctor = { user_id: string; display_name: string | null; role: string };
type ResponseRow = { id: string; question_id: string; doctor_id: string; response: string; status: string; created_at: string };
type Faq = { id: string; question: string; answer: string; status: string };

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [responses, setResponses] = useState<ResponseRow[]>([]);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Record<string, string>>({});
  const [category, setCategory] = useState<Record<string, string>>({});
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [busyId, setBusyId] = useState('');
  const [adminName, setAdminName] = useState('Admin');

  const verifyAdmin = useCallback(async () => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) { router.replace('/staff-login' as any); return false; }
    const { data: staff, error } = await supabase.from('staff_users').select('role,display_name').eq('user_id', user.id).maybeSingle();
    if (error || staff?.role !== 'admin') { await supabase.auth.signOut(); router.replace('/staff-login' as any); return false; }
    setAdminName(staff.display_name || 'Admin');
    return true;
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (!await verifyAdmin()) return;
      const [q, d, r, f] = await Promise.all([
        supabase.from('unanswered_questions').select('id,question,status,created_at,category_id').in('status', ['new','under_review','assigned','awaiting_doctor']).order('created_at', { ascending: true }),
        supabase.from('staff_users').select('user_id,display_name,role').eq('role', 'doctor').order('display_name'),
        supabase.from('doctor_responses').select('id,question_id,doctor_id,response,status,created_at').eq('status', 'submitted').order('created_at', { ascending: true }),
        supabase.from('faqs').select('id,question,answer,status').order('updated_at', { ascending: false }).limit(30),
      ]);
      if (q.error) throw q.error; if (d.error) throw d.error; if (r.error) throw r.error; if (f.error) throw f.error;
      setQuestions((q.data || []) as Question[]); setDoctors((d.data || []) as Doctor[]); setResponses((r.data || []) as ResponseRow[]); setFaqs((f.data || []) as Faq[]);
    } catch (e: any) { Alert.alert('Could not load dashboard', e?.message || 'Please try again.'); }
    finally { setLoading(false); }
  }, [verifyAdmin]);

  useEffect(() => { load(); }, [load]);

  const assign = async (questionId: string) => {
    const doctorId = selectedDoctor[questionId];
    if (!doctorId) { Alert.alert('Select a doctor', 'Choose a doctor before assigning this question.'); return; }
    setBusyId(questionId);
    try {
      const { error } = await supabase.rpc('admin_assign_question', { p_question_id: questionId, p_doctor_id: doctorId });
      if (error) throw error;
      await load();
    } catch (e: any) { Alert.alert('Assignment failed', e?.message || 'Please try again.'); }
    finally { setBusyId(''); }
  };

  const reviewResponse = async (id: string, approve: boolean) => {
    setBusyId(id);
    try {
      if (approve) {
        const { error } = await supabase.rpc('admin_publish_doctor_response', { p_response_id: id });
        if (error) throw error;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase.from('doctor_responses').update({ status: 'rejected', reviewed_by: user?.id, reviewed_at: new Date().toISOString() }).eq('id', id).eq('status', 'submitted');
        if (error) throw error;
      }
      await load();
    } catch (e: any) { Alert.alert('Could not update response', e?.message || 'Please try again.'); }
    finally { setBusyId(''); }
  };

  const saveFaq = async () => {
    if (!newQuestion.trim() || !newAnswer.trim()) { Alert.alert('Missing information', 'Enter both the FAQ question and answer.'); return; }
    setBusyId('new-faq');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('faqs').insert({ question: newQuestion.trim(), answer: newAnswer.trim(), status: 'pending', created_by: user?.id });
      if (error) throw error;
      setNewQuestion(''); setNewAnswer('');
      Alert.alert('FAQ submitted', 'The FAQ was saved as pending. It will not be used by SIA until approved.');
      await load();
    } catch (e: any) { Alert.alert('Could not save FAQ', e?.message || 'Please try again.'); }
    finally { setBusyId(''); }
  };

  const logout = async () => { await supabase.auth.signOut(); router.replace('/staff-login' as any); };
  const doctorLabel = (id: string) => doctors.find(d => d.user_id === id)?.display_name || id.slice(0, 8);

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={PINK} /><Text style={s.muted}>Loading admin workspace…</Text></View>;
  return <View style={s.page}><ScrollView contentContainerStyle={s.content}>
    <View style={s.top}><View><Text style={s.brand}>MumWise · STAFF</Text><Text style={s.title}>Admin Dashboard</Text><Text style={s.muted}>Welcome, {adminName}</Text></View><TouchableOpacity onPress={logout} style={s.logout}><Text style={s.logoutText}>Sign out</Text></TouchableOpacity></View>
    <View style={s.stats}><Stat label="Open questions" value={questions.length} /><Stat label="Awaiting review" value={responses.length} /><Stat label="Registered doctors" value={doctors.length} /></View>
    <Section title="Unanswered questions" subtitle="Assign each question to an authorised doctor.">
      {questions.length === 0 ? <Empty text="No unanswered questions currently need attention." /> : questions.map(q => <View key={q.id} style={s.item}>
        <Text style={s.question}>{q.question}</Text><Text style={s.meta}>Status: {q.status} · {new Date(q.created_at).toLocaleString()}</Text>
        <View style={s.rowWrap}>{doctors.map(d => <TouchableOpacity key={d.user_id} onPress={() => setSelectedDoctor(p => ({ ...p, [q.id]: d.user_id }))} style={[s.chip, selectedDoctor[q.id] === d.user_id && s.chipSelected]}><Text style={[s.chipText, selectedDoctor[q.id] === d.user_id && s.chipTextSelected]}>{d.display_name || d.user_id.slice(0, 8)}</Text></TouchableOpacity>)}</View>
        <TouchableOpacity style={s.primary} disabled={busyId === q.id || doctors.length === 0} onPress={() => assign(q.id)}><Text style={s.primaryText}>{busyId === q.id ? 'Assigning…' : 'Assign selected doctor'}</Text></TouchableOpacity>
      </View>)}</Section>
    <Section title="Doctor responses awaiting approval" subtitle="Approved responses are published into the FAQ database for SIA.">
      {responses.length === 0 ? <Empty text="No submitted doctor responses awaiting review." /> : responses.map(r => <View key={r.id} style={s.item}><Text style={s.meta}>Question ID: {r.question_id} · Doctor: {doctorLabel(r.doctor_id)}</Text><Text style={s.body}>{r.response}</Text><View style={s.row}><TouchableOpacity style={s.primary} onPress={() => reviewResponse(r.id, true)} disabled={!!busyId}><Text style={s.primaryText}>Approve & publish</Text></TouchableOpacity><TouchableOpacity style={s.secondary} onPress={() => reviewResponse(r.id, false)} disabled={!!busyId}><Text style={s.secondaryText}>Reject</Text></TouchableOpacity></View></View>)}</Section>
    <Section title="Add an FAQ" subtitle="New entries are saved as pending and require approval before SIA can use them.">
      <TextInput value={newQuestion} onChangeText={setNewQuestion} placeholder="FAQ question" style={s.input} />
      <TextInput value={newAnswer} onChangeText={setNewAnswer} placeholder="Approved clinical answer text" multiline style={[s.input, s.textarea]} />
      <TouchableOpacity style={s.primary} onPress={saveFaq} disabled={busyId === 'new-faq'}><Text style={s.primaryText}>{busyId === 'new-faq' ? 'Saving…' : 'Save FAQ as pending'}</Text></TouchableOpacity>
    </Section>
    <Section title="FAQ library" subtitle="Recent entries and their approval status.">
      {faqs.length === 0 ? <Empty text="No FAQs found." /> : faqs.map(f => <View key={f.id} style={s.item}><Text style={s.question}>{f.question}</Text><Text style={s.body}>{f.answer}</Text><Text style={s.meta}>Status: {f.status}</Text></View>)}
    </Section>
    <TouchableOpacity onPress={load} style={s.refresh}><Text style={s.secondaryText}>Refresh dashboard</Text></TouchableOpacity>
  </ScrollView></View>;
}

function Stat({ label, value }: { label: string; value: number }) { return <View style={s.stat}><Text style={s.statValue}>{value}</Text><Text style={s.statLabel}>{label}</Text></View>; }
function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) { return <View style={s.section}><Text style={s.sectionTitle}>{title}</Text><Text style={s.muted}>{subtitle}</Text>{children}</View>; }
function Empty({ text }: { text: string }) { return <Text style={s.empty}>{text}</Text>; }

const s = StyleSheet.create({ page: { flex: 1, minHeight: '100%' as any, backgroundColor: '#FFF7FA' }, content: { width: '100%', maxWidth: 1120, alignSelf: 'center', padding: 24, paddingBottom: 60 }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF7FA' }, top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }, brand: { color: PINK, fontWeight: '900', letterSpacing: 1, fontSize: 12 }, title: { fontSize: 30, fontWeight: '900', color: '#512D3D', marginTop: 5 }, muted: { color: '#8A6677', fontSize: 13, lineHeight: 20, marginTop: 4 }, logout: { borderWidth: 1, borderColor: '#E8C8D5', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 15 }, logoutText: { color: PINK, fontWeight: '800' }, stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 8 }, stat: { backgroundColor: '#fff', borderColor: '#F0DCE4', borderWidth: 1, borderRadius: 15, padding: 18, minWidth: 180, flexGrow: 1 }, statValue: { fontSize: 27, fontWeight: '900', color: PINK }, statLabel: { color: '#755466', marginTop: 3, fontWeight: '600' }, section: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#F0DCE4', borderRadius: 18, padding: 20, marginTop: 18 }, sectionTitle: { color: '#512D3D', fontSize: 19, fontWeight: '900' }, item: { borderTopWidth: 1, borderTopColor: '#F3E5EB', paddingTop: 15, marginTop: 15 }, question: { color: '#512D3D', fontSize: 15, fontWeight: '800', lineHeight: 22 }, body: { color: '#64485A', lineHeight: 21, marginTop: 8 }, meta: { color: '#967C89', fontSize: 12, marginTop: 7 }, row: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 12 }, rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }, chip: { borderWidth: 1, borderColor: '#E7CAD5', borderRadius: 20, paddingVertical: 7, paddingHorizontal: 12 }, chipSelected: { backgroundColor: '#FCE7EF', borderColor: PINK }, chipText: { color: '#79586A', fontSize: 12, fontWeight: '600' }, chipTextSelected: { color: PINK }, primary: { backgroundColor: PINK, borderRadius: 10, paddingVertical: 11, paddingHorizontal: 15, alignItems: 'center', marginTop: 12, alignSelf: 'flex-start' }, primaryText: { color: '#fff', fontWeight: '800' }, secondary: { borderWidth: 1, borderColor: '#E4C7D2', borderRadius: 10, paddingVertical: 11, paddingHorizontal: 15, marginTop: 12 }, secondaryText: { color: PINK, fontWeight: '800' }, input: { borderWidth: 1, borderColor: '#EAD5DE', borderRadius: 10, padding: 12, marginTop: 12, color: '#512D3D', backgroundColor: '#FFFCFD' }, textarea: { minHeight: 110, textAlignVertical: 'top' }, empty: { color: '#8A6677', paddingVertical: 17 }, refresh: { alignSelf: 'center', padding: 15, marginTop: 12 } });
