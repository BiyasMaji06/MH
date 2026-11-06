import React, { useMemo, useState } from 'react';
import {
  Alert, Modal, Platform, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Asset } from 'expo-asset';
import * as Sharing from 'expo-sharing';
import { ALL_FOODS, normalizeFoodName, scaleNutrients, Food, Nutrients } from '../data/foodDatabase';

type MealType = 'Breakfast' | 'Lunch' | 'Evening Snack' | 'Dinner';
type Entry = { id: string; food: Food; grams: number };
const MEALS: MealType[] = ['Breakfast', 'Lunch', 'Evening Snack', 'Dinner'];
const C = {
  pink: '#E8558D', dark: '#B23A63', pale: '#FDEDF3', bg: '#FFF8FB',
  white: '#FFFFFF', text: '#512D3D', muted: '#9A7585', border: '#F3D4E0',
  green: '#35B987', purple: '#8B79E8', orange: '#F1AD69',
};
const GOALS = { calories: 2000, protein: 75, carbs: 250, fat: 70, fiber: 30 };
const empty = (): Nutrients => ({ calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, iron: 0 });
const sum = (entries: Entry[]): Nutrients => entries.reduce((a, e) => {
  const n = scaleNutrients(e.food, e.grams);
  return {
    calories: a.calories + n.calories, protein: a.protein + n.protein,
    carbs: a.carbs + n.carbs, fat: a.fat + n.fat, fiber: a.fiber + n.fiber,
    iron: a.iron + n.iron,
  };
}, empty());

const RESOURCE_TITLE = '6–12 Week Trimester Diet Pregnancy Plan';
const RESOURCE_ASSET = require('../../assets/resources/6-12 week Trimester Diet Pregnancy Plan.pdf');

type Props = { onBack?: () => void };

export default function NutritionTrackingScreen({ onBack }: Props) {
  const [tab, setTab] = useState<'Today' | 'Analysis' | 'Resources'>('Today');
  const [entries, setEntries] = useState<Record<MealType, Entry[]>>({
    Breakfast: [], Lunch: [], 'Evening Snack': [], Dinner: [],
  });
  const [modal, setModal] = useState(false);
  const [meal, setMeal] = useState<MealType>('Breakfast');
  const [query, setQuery] = useState('');
  const [food, setFood] = useState<Food | null>(null);
  const [grams, setGrams] = useState('100');
  const [calculatorVisible, setCalculatorVisible] = useState(false);
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [waterMl, setWaterMl] = useState(0);

  const all = useMemo(() => MEALS.flatMap(m => entries[m]), [entries]);
  const totals = useMemo(() => sum(all), [all]);
  const results = useMemo(() => {
    const q = normalizeFoodName(query.trim());
    if (!q) return [];
    const aliases: Record<string, string[]> = {
      poha: ['flattened rice', 'beaten rice', 'aval'], roti: ['chapati', 'phulka'],
      dal: ['daal', 'lentils'], curd: ['dahi', 'yogurt', 'yoghurt'],
      paneer: ['cottage cheese'], rice: ['cooked rice', 'boiled rice'],
      banana: ['kela'], spinach: ['palak'], rajma: ['kidney beans'],
    };
    const terms = [q, ...(aliases[q] || [])].map(normalizeFoodName);
    return ALL_FOODS.filter(f => terms.some(t => normalizeFoodName(f.name).includes(t)))
      .sort((a, b) => Number(terms.includes(normalizeFoodName(b.name))) - Number(terms.includes(normalizeFoodName(a.name))))
      .slice(0, 35);
  }, [query]);

  const openSearch = (m: MealType) => {
    setMeal(m); setQuery(''); setFood(null); setGrams('100'); setModal(true);
  };
  const addFood = () => {
    const amount = Number(grams);
    if (!food) return Alert.alert('Choose a food', 'Select an item from the search results.');
    if (!Number.isFinite(amount) || amount <= 0 || amount > 3000)
      return Alert.alert('Check serving size', 'Enter a serving between 1 and 3000 grams.');
    setEntries(prev => ({ ...prev, [meal]: [...prev[meal], { id: `${Date.now()}-${Math.random()}`, food, grams: amount }] }));
    setModal(false); setFood(null); setQuery('');
  };
  const removeFood = (m: MealType, id: string) => {
    Alert.alert('Remove food?', 'Remove this item from your meal log?', [
      { text: 'Keep', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () =>
        setEntries(prev => ({ ...prev, [m]: prev[m].filter(e => e.id !== id) })) },
    ]);
  };
  const openResource = async () => {
    try {
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert(
          'Sharing unavailable',
          'PDF sharing is not available on this device.',
        );
        return;
      }

      const asset = Asset.fromModule(RESOURCE_ASSET);
      await asset.downloadAsync();

      if (!asset.localUri) {
        Alert.alert('PDF unavailable', 'The resource could not be loaded. Check that the PDF is in assets/resources.');
        return;
      }

      await Sharing.shareAsync(asset.localUri, {
        mimeType: 'application/pdf',
        dialogTitle: RESOURCE_TITLE,
        UTI: 'com.adobe.pdf',
      });
    } catch (error) {
      console.error('Unable to open nutrition resource:', error);
      Alert.alert(
        'Could not open PDF',
        'Check the PDF filename and location, then restart the Expo development server.',
      );
    }
  };

  const pct = (v: number, g: number) => Math.max(0, Math.min(1, v / g)) * 100;
  const nutrient = (label: string, value: number, goal: number, color: string, unit = 'g') => (
    <View style={s.nutrient} key={label}>
      <Text style={s.nutrientName}>{label}</Text>
      <View style={s.bar}><View style={[s.barFill, { width: `${pct(value, goal)}%`, backgroundColor: color }]} /></View>
      <Text style={s.nutrientValue}>{Math.round(value)} / {goal} {unit}</Text>
    </View>
  );
  const analysisNutrient = (label: string, value: number, goal: number, color: string, unit = 'g') => (
    <View style={s.analysisNutrient} key={label}>
      <Text style={s.analysisNutrientName}>{label}</Text>
      <View style={s.analysisBar}>
        <View style={[s.barFill, { width: `${pct(value, goal)}%`, backgroundColor: color }]} />
      </View>
      <Text style={s.analysisNutrientValue}>
        {Math.round(value).toLocaleString()} / {goal.toLocaleString()} {unit}
      </Text>
    </View>
  );

  const renderMeal = (m: MealType) => {
    const icons: Record<MealType, keyof typeof Ionicons.glyphMap> = {
      Breakfast: 'sunny-outline', Lunch: 'restaurant-outline',
      'Evening Snack': 'cafe-outline', Dinner: 'moon-outline',
    };
    return (
      <View style={s.mealCard} key={m}>
        <View style={s.mealHead}>
          <View style={s.mealIcon}><Ionicons name={icons[m]} size={19} color={C.dark} /></View>
          <View style={{ flex: 1 }}>
            <Text style={s.mealTitle}>{m}</Text>
            <Text style={s.sub}>{Math.round(sum(entries[m]).calories)} kcal</Text>
          </View>
          <TouchableOpacity style={s.addButton} onPress={() => openSearch(m)}>
            <Ionicons name="add" size={21} color="white" />
          </TouchableOpacity>
        </View>
        {entries[m].length === 0 ? (
          <TouchableOpacity style={s.emptyMeal} onPress={() => openSearch(m)}>
            <Ionicons name="add-circle-outline" color={C.pink} size={18} />
            <Text style={s.pinkText}>Add food</Text>
          </TouchableOpacity>
        ) : entries[m].map(e => {
          const n = scaleNutrients(e.food, e.grams);
          return (
            <View style={s.foodRow} key={e.id}>
              <View style={{ flex: 1 }}>
                <Text style={s.foodName}>{e.food.name}</Text>
                <Text style={s.sub}>{e.grams} g · P {n.protein.toFixed(1)} g · C {n.carbs.toFixed(1)} g</Text>
              </View>
              <Text style={s.kcal}>{Math.round(n.calories)} kcal</Text>
              <TouchableOpacity onPress={() => removeFood(m, e.id)} hitSlop={10} style={s.removeButton}>
                <Ionicons name="trash-outline" size={18} color="#C44F70" />
                <Text style={s.removeText}>Remove</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <LinearGradient colors={['#FCEAF1', '#FDEBF2', '#FFF7FA']} style={s.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <View style={s.header}>
          <TouchableOpacity onPress={onBack || (() => router.replace('/home'))} style={s.back}>
            <Ionicons name="chevron-back" size={25} color="#17204B" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Nutrition</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={s.tabs}>
          {(['Today', 'Analysis', 'Resources'] as const).map(t => (
            <TouchableOpacity key={t} onPress={() => setTab(t)} style={[s.tab, tab === t && s.tabActive]}>
              <Text style={[s.tabText, tab === t && s.tabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          {tab === 'Today' && <>
            <View style={s.summaryCard}>
              <View style={s.summaryTop}>
                <View style={s.circle}>
                  <Text style={s.calorieNumber}>{Math.round(totals.calories).toLocaleString()}</Text>
                  <Text style={s.calorieUnit}>kcal</Text>
                  <Text style={s.ofText}>of {GOALS.calories.toLocaleString()} cal</Text>
                </View>
                <View style={s.nutrientList}>
                  {nutrient('Protein', totals.protein, GOALS.protein, C.green)}
                  {nutrient('Carbs', totals.carbs, GOALS.carbs, C.orange)}
                  {nutrient('Fats', totals.fat, GOALS.fat, C.purple)}
                  {nutrient('Fiber', totals.fiber, GOALS.fiber, C.orange)}
                </View>
              </View>
              <Text style={s.disclaimer}>Illustrative reference only — not an individualized pregnancy target.</Text>
            </View>
            <View style={s.actions}>
              <TouchableOpacity style={s.actionCard} onPress={() => openSearch('Breakfast')}>
                <Ionicons name="nutrition-outline" size={24} color="#4032A5" />
                <Text style={s.actionText}>Add Food / Meal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.actionCard} onPress={() => setCalculatorVisible(true)}>
                <Ionicons name="calculator-outline" size={24} color="#4032A5" />
                <Text style={s.actionText}>Calorie Calculator</Text>
              </TouchableOpacity>
            </View>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Today's Meals</Text>
              <Text style={s.sub}>{all.length} items</Text>
            </View>
            {MEALS.map(renderMeal)}
            <View style={s.waterCard}>
              <View style={{ flex: 1 }}>
                <Text style={s.sectionTitle}>Water intake</Text>
                <Text style={s.sub}>{waterMl.toLocaleString()} ml logged</Text>
              </View>
              <View style={s.waterControls}>
                <TouchableOpacity
                  style={[s.waterAdjust, waterMl === 0 && s.waterAdjustDisabled]}
                  onPress={() => setWaterMl(v => Math.max(0, v - 250))}
                  disabled={waterMl === 0}
                  accessibilityRole="button"
                  accessibilityLabel="Remove 250 millilitres of water"
                >
                  <Ionicons name="remove" size={19} color={waterMl === 0 ? '#BFAAB3' : C.dark} />
                  <Text style={[s.waterAdjustText, waterMl === 0 && s.waterAdjustTextDisabled]}>250 ml</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.waterAdd}
                  onPress={() => setWaterMl(v => v + 250)}
                  accessibilityRole="button"
                  accessibilityLabel="Add 250 millilitres of water"
                >
                  <Ionicons name="add" size={18} color="white" />
                  <Text style={s.waterAddText}>250 ml</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>}
          {tab === 'Analysis' && (
            <View style={s.summaryCard}>
              <Text style={s.sectionTitle}>Nutrition analysis</Text>
              <Text style={s.sub}>Totals from foods you have logged today.</Text>
              <View style={s.analysisRows}>
                {analysisNutrient('Calories', totals.calories, GOALS.calories, C.pink, 'kcal')}
                {analysisNutrient('Protein', totals.protein, GOALS.protein, C.green)}
                {analysisNutrient('Carbohydrates', totals.carbs, GOALS.carbs, C.orange)}
                {analysisNutrient('Fats', totals.fat, GOALS.fat, C.purple)}
                {analysisNutrient('Fiber', totals.fiber, GOALS.fiber, C.orange)}
              </View>
              <Text style={s.disclaimer}>Food database values are estimates and vary by ingredients and preparation.</Text>
            </View>
          )}
          {tab === 'Resources' && (
            <View style={s.summaryCard}>
              <Text style={s.sectionTitle}>Recommended Nutrition</Text>
              <Text style={s.sub}>Pregnancy information and practical guidance</Text>
              <TouchableOpacity style={s.resourceRow} onPress={openResource} activeOpacity={0.75}>
                <Ionicons name="document-text" size={25} color="#E84D69" />
                <View style={{ flex: 1 }}>
                  <Text style={s.resourceTitle}>{RESOURCE_TITLE}</Text>
                  <Text style={s.sub}>PDF · Tap to open or share</Text>
                </View>
                <Ionicons name="download-outline" size={21} color="#5A49D6" />
              </TouchableOpacity>
              <Text style={s.disclaimer}>
                Opens the PDF using your device’s share options. You can save it to your device from there.
              </Text>
            </View>
          )}
          <View style={{ height: 18 }} />
        </ScrollView>
        <View style={s.bottomNav}>
          {[
            { label: 'Home', icon: 'home-outline' as const },
            { label: 'Track', icon: 'pricetag-outline' as const },
            { label: 'Learn', icon: 'book-outline' as const },
            { label: 'Chat', icon: 'chatbubble-ellipses-outline' as const },
            { label: 'More', icon: 'ellipsis-horizontal' as const },
          ].map(item => (
            <TouchableOpacity key={item.label} style={s.navItem}
              onPress={() => item.label === 'Home' ? router.replace('/home') :
                item.label === 'Track' ? setTab('Today') :
                Alert.alert(item.label, 'This section is not connected yet.')}>
              <Ionicons name={item.icon} size={20} color={item.label === 'Track' ? '#30278F' : '#526080'} />
              <Text style={[s.navText, item.label === 'Track' && { color: '#30278F', fontWeight: '700' }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Modal visible={modal} transparent animationType="slide" onRequestClose={() => setModal(false)}>
          <KeyboardAvoidingView style={s.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={s.modal}>
              <View style={s.modalHeader}>
                <View><Text style={s.sectionTitle}>Add food</Text><Text style={s.sub}>Add to {meal}</Text></View>
                <TouchableOpacity onPress={() => setModal(false)}><Ionicons name="close" size={25} color={C.dark} /></TouchableOpacity>
              </View>
              <TextInput style={s.input} placeholder="Search foods..." value={query} onChangeText={v => { setQuery(v); setFood(null); }} />
              <ScrollView keyboardShouldPersistTaps="handled" style={{ flex: 1 }}>
                {!query.trim() ? <Text style={s.emptyHint}>Search for rice, dal, banana, milk…</Text> :
                  results.length === 0 ? <Text style={s.emptyHint}>No matching foods found.</Text> :
                  results.map(f => <TouchableOpacity key={f.id} style={[s.result, food?.id === f.id && s.selected]} onPress={() => setFood(f)}>
                    <View style={{ flex: 1 }}><Text style={s.foodName}>{f.name}</Text><Text style={s.sub}>{Math.round(f.nutrients.calories)} kcal per 100 g</Text></View>
                    <Ionicons name={food?.id === f.id ? 'radio-button-on' : 'radio-button-off'} color={C.pink} size={21} />
                  </TouchableOpacity>)}
              </ScrollView>
              {food && <View style={s.serving}>
                <Text style={s.label}>Serving size (grams)</Text>
                <TextInput style={s.input} value={grams} onChangeText={setGrams} keyboardType="decimal-pad" />
                <TouchableOpacity style={s.primary} onPress={addFood}><Text style={s.primaryText}>Add to {meal}</Text></TouchableOpacity>
              </View>}
            </View>
          </KeyboardAvoidingView>
        </Modal>

        <Modal visible={calculatorVisible} transparent animationType="fade" onRequestClose={() => setCalculatorVisible(false)}>
          <View style={s.overlay}>
            <View style={s.calcModal}>
              <View style={s.modalHeader}><Text style={s.sectionTitle}>Calorie Calculator</Text>
                <TouchableOpacity onPress={() => setCalculatorVisible(false)}><Ionicons name="close" size={24} color={C.dark} /></TouchableOpacity></View>
              <Text style={s.sub}>Optional estimate only. Pregnancy energy needs depend on individual factors and trimester.</Text>
              <Text style={s.label}>Weight (kg)</Text><TextInput style={s.input} value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="e.g. 60" />
              <Text style={s.label}>Height (cm)</Text><TextInput style={s.input} value={height} onChangeText={setHeight} keyboardType="decimal-pad" placeholder="e.g. 165" />
              <TouchableOpacity style={s.primary} onPress={() => Alert.alert('Personal advice', 'Please ask your maternity-care professional to determine an appropriate energy target. This demo does not calculate a clinical calorie prescription.')}><Text style={s.primaryText}>Continue</Text></TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1, backgroundColor: 'transparent' },

  header: {
    minHeight: 54, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 2,
  },
  back: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 21, fontWeight: '800', color: '#A93663' },

  tabs: {
    flexDirection: 'row', marginHorizontal: 18, marginTop: 7, marginBottom: 15,
    backgroundColor: '#F4DDE7', borderRadius: 17, padding: 4,
  },
  tab: { flex: 1, minHeight: 43, paddingVertical: 10, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  tabActive: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F1C8D8', elevation: 2 },
  tabText: { color: '#80566A', fontSize: 12, fontWeight: '700' },
  tabTextActive: { color: '#A93663', fontWeight: '800' },

  content: { paddingHorizontal: 17, paddingBottom: 22, flexGrow: 1 },
  summaryCard: {
    backgroundColor: '#FFFFFF', borderRadius: 23, padding: 17,
    borderWidth: 1, borderColor: '#F4DCE6', elevation: 3,
    shadowColor: '#9D4667', shadowOpacity: 0.08, shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }, marginBottom: 15,
  },
  summaryTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  circle: {
    width: 116, height: 116, borderRadius: 58, borderWidth: 7,
    borderColor: '#E8558D', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFFBFD',
  },
  calorieNumber: { fontSize: 21, color: '#512D3D', fontWeight: '800' },
  calorieUnit: { position: 'absolute', marginLeft: 70, marginTop: -4, fontSize: 10, color: '#512D3D' },
  ofText: { color: '#896B7A', fontSize: 11, fontWeight: '700', marginTop: 3 },
  nutrientList: { flex: 1, gap: 13, minWidth: 0 },
  nutrient: { flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 0 },
  nutrientName: { width: 48, color: '#512D3D', fontSize: 10, fontWeight: '800' },
  bar: { flex: 1, minWidth: 12, height: 7, backgroundColor: '#F3E8ED', borderRadius: 6, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 6 },
  nutrientValue: { width: 57, fontSize: 9, color: '#765B69', textAlign: 'right', fontWeight: '700' },
  disclaimer: { color: '#987F8B', fontSize: 10, lineHeight: 15, marginTop: 14 },

  actions: { flexDirection: 'row', gap: 11, marginBottom: 21 },
  actionCard: {
    flex: 1, minHeight: 72, borderRadius: 19, backgroundColor: '#F1EAFE',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 9, paddingHorizontal: 10, paddingVertical: 12,
    borderWidth: 1, borderColor: '#E9E0FA',
  },
  actionText: { color: '#493A91', fontSize: 12, fontWeight: '800', flexShrink: 1 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#512D3D' },
  sub: { color: '#9A7585', fontSize: 12, marginTop: 4 },

  mealCard: {
    backgroundColor: '#FFFFFF', borderRadius: 21, padding: 15, marginBottom: 12,
    borderWidth: 1, borderColor: '#F3DDE6', elevation: 2,
    shadowColor: '#9D4667', shadowOpacity: 0.06, shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
  },
  mealHead: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  mealIcon: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#FCE8F0', alignItems: 'center', justifyContent: 'center' },
  mealTitle: { color: '#512D3D', fontSize: 15, fontWeight: '800' },
  addButton: { width: 39, height: 39, borderRadius: 14, backgroundColor: '#E8558D', alignItems: 'center', justifyContent: 'center' },
  emptyMeal: { flexDirection: 'row', gap: 8, alignItems: 'center', paddingTop: 13, marginTop: 13, borderTopWidth: 1, borderColor: '#F6E8EE' },
  pinkText: { color: '#D64C80', fontWeight: '800', fontSize: 13 },
  foodRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderColor: '#F6E8EE', marginTop: 12, paddingTop: 12 },
  foodName: { color: '#512D3D', fontSize: 13, fontWeight: '800' },
  kcal: { color: '#B23A63', fontSize: 11, fontWeight: '800' },
  removeButton: { alignItems: 'center', paddingHorizontal: 4 },
  removeText: { fontSize: 9, color: '#C44F70', marginTop: 2 },

  waterCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16,
    flexDirection: 'row', alignItems: 'center', marginBottom: 12,
    borderWidth: 1, borderColor: '#F3DDE6',
  },
  waterControls: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  waterAdjust: { flexDirection: 'row', gap: 3, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FCEAF1', borderWidth: 1, borderColor: '#F0D3DF', borderRadius: 13, paddingHorizontal: 9, paddingVertical: 11 },
  waterAdjustDisabled: { backgroundColor: '#F7F2F4', borderColor: '#EEE5E9' },
  waterAdjustText: { color: '#B23A63', fontWeight: '800', fontSize: 10 },
  waterAdjustTextDisabled: { color: '#BFAAB3' },
  waterAdd: { flexDirection: 'row', gap: 4, alignItems: 'center', backgroundColor: '#D94E83', borderRadius: 13, paddingHorizontal: 10, paddingVertical: 11 },
  waterAddText: { color: 'white', fontWeight: '800', fontSize: 10 },

  analysisRows: { marginTop: 20, gap: 18 },
  analysisNutrient: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 9, minHeight: 22 },
  analysisNutrientName: { width: 88, color: '#512D3D', fontSize: 11, lineHeight: 15, fontWeight: '800' },
  analysisBar: { flex: 1, minWidth: 18, height: 8, backgroundColor: '#F1E8ED', borderRadius: 6, overflow: 'hidden' },
  analysisNutrientValue: { width: 91, textAlign: 'right', color: '#765B69', fontSize: 10, lineHeight: 14, fontWeight: '700' },

  resourceRow: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 17, marginTop: 13, borderTopWidth: 1, borderColor: '#F4E4EB' },
  resourceTitle: { fontSize: 13, color: '#512D3D', fontWeight: '800', lineHeight: 18 },

  bottomNav: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderTopWidth: 1, borderColor: '#F0DDE5',
    paddingTop: 10, paddingBottom: 8,
  },
  navItem: { flex: 1, alignItems: 'center', gap: 4, minHeight: 43, justifyContent: 'center' },
  navText: { fontSize: 10, color: '#9A7585', fontWeight: '600' },

  overlay: { flex: 1, backgroundColor: '#34132177', justifyContent: 'flex-end' },
  modal: { height: '84%', backgroundColor: '#FFF8FB', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 18 },
  calcModal: { backgroundColor: 'white', margin: 22, borderRadius: 22, padding: 19 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  input: { backgroundColor: 'white', borderWidth: 1, borderColor: '#F0D7E2', borderRadius: 13, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 11, color: '#512D3D', fontSize: 14 },
  result: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1, borderColor: '#F3E4EA' },
  selected: { backgroundColor: '#FCEAF1', paddingHorizontal: 9, borderRadius: 11 },
  emptyHint: { textAlign: 'center', color: '#9A7585', padding: 24, fontSize: 13 },
  serving: { backgroundColor: 'white', borderRadius: 16, padding: 13, marginTop: 10, borderWidth: 1, borderColor: '#F3DDE6' },
  label: { color: '#512D3D', fontSize: 12, fontWeight: '800', marginBottom: 7 },
  primary: { backgroundColor: '#E8558D', borderRadius: 13, padding: 14, alignItems: 'center', marginTop: 8 },
  primaryText: { color: 'white', fontWeight: '800', fontSize: 13 },
});
