// Centralized nutrition database. Import ALL_FOODS from this file in screens/components.
// All source datasets remain private implementation details and are never displayed in the UI.

import indbData from './indb_foods.json';
import foodsData from './foods.json';
import simpleFoodsData from './foods-simple.json';
import animalMeatData from './animal-meat.json';
import cerealsData from './cereals-and-millets.json';
import spicesData from './condiments-and-spices.json';
import oilsData from './edible-oils-and-fats.json';
import eggData from './egg-and-egg-products.json';
import freshwaterFishData from './fresh-water-fish-and-shellfish.json';
import fruitsData from './fruits.json';
import legumesData from './grain-legumes.json';
import leafyVegetablesData from './green-leafy-vegetables.json';
import marineFishData from './marine-fish.json';
import marineMolluscsData from './marine-mollusks.json';
import marineShellfishData from './marine-shellfish.json';
import dairyData from './milk-and-milk-products.json';
import miscellaneousData from './miscellaneous-foods.json';
import mushroomsData from './mushrooms.json';
import nutsData from './nuts-and-oil-seeds.json';
import otherVegetablesData from './other-vegetables.json';
import poultryData from './poultry.json';
import rootsData from './roots-and-tubers.json';
import sugarsData from './sugars.json';

export type Nutrients = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  iron: number;
};

export type Food = {
  id: string;
  name: string;
  nutrients: Nutrients;
};

const rawDatasets: unknown[] = [
  // Priority order: prepared recipes first, then broader ingredient datasets.
  indbData,
  foodsData,
  animalMeatData,
  cerealsData,
  spicesData,
  oilsData,
  eggData,
  freshwaterFishData,
  fruitsData,
  legumesData,
  leafyVegetablesData,
  marineFishData,
  marineMolluscsData,
  marineShellfishData,
  dairyData,
  miscellaneousData,
  mushroomsData,
  nutsData,
  otherVegetablesData,
  poultryData,
  rootsData,
  sugarsData,
  simpleFoodsData,
];

function extractRecords(value: any): any[] {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return [];
  for (const key of ['foods', 'data', 'items', 'results', 'records']) {
    if (Array.isArray(value[key])) return value[key];
  }
  const values = Object.values(value);
  if (values.length && values.every((item) => item && typeof item === 'object')) {
    return values;
  }
  return [];
}

function getFoodName(record: any): string {
  const value =
    record?.name ?? record?.food_name ?? record?.foodName ?? record?.food ??
    record?.description ?? record?.food_description ?? record?.common_name ??
    record?.commonName ?? record?.Food ?? record?.['Food name'] ??
    record?.['food name'] ?? '';
  return typeof value === 'string' ? value.trim() : '';
}

function findNumber(record: any, aliases: string[]): number | null {
  if (!record || typeof record !== 'object') return null;
  const normalizedAliases = aliases.map((name) => name.toLowerCase().replace(/[^a-z0-9]/g, ''));
  for (const [key, value] of Object.entries(record)) {
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normalizedAliases.includes(normalizedKey) && value !== null && value !== '' && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }
  return null;
}

function findNestedNutrientRecord(record: any): any {
  for (const key of ['per100g', 'per_100g', 'per_100_g', 'nutrients', 'nutrition']) {
    if (record?.[key] && typeof record[key] === 'object' && !Array.isArray(record[key])) {
      return record[key];
    }
  }
  return record;
}

function normalizeFood(record: any, index: number): Food | null {
  const name = getFoodName(record);
  if (!name) return null;
  const nested = findNestedNutrientRecord(record);
  const get = (aliases: string[]) => findNumber(nested, aliases) ?? findNumber(record, aliases) ?? 0;
  return {
    id: String(record.id ?? record.food_code ?? record.code ?? index),
    name,
    nutrients: {
      calories: get(['energy_kcal', 'energyKcal', 'calories', 'energy', 'kcal', 'cal']),
      protein: get(['protein_g', 'protein', 'proteins', 'pro']),
      carbs: get(['carb_g', 'carbs_g', 'carbs', 'carbohydrates', 'carbohydrate_g', 'carb']),
      fat: get(['fat_g', 'fat', 'total_fat_g', 'total_fat']),
      fiber: get(['fibre_g', 'fiber_g', 'fibre', 'fiber', 'dietary_fiber']),
      iron: get(['iron_mg', 'iron']),
    },
  };
}

export function normalizeFoodName(name: string): string {
  return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}

const nutrientCompleteness = (food: Food) => Object.values(food.nutrients).filter((value) => value > 0).length;

export const ALL_FOODS: Food[] = (() => {
  const unique = new Map<string, Food>();
  rawDatasets.forEach((dataset) => {
    extractRecords(dataset).forEach((record, index) => {
      const food = normalizeFood(record, index);
      if (!food) return;
      const key = normalizeFoodName(food.name);
      if (!key) return;
      const existing = unique.get(key);
      // Prefer the more complete nutrient record when duplicate names occur.
      if (!existing || nutrientCompleteness(food) > nutrientCompleteness(existing)) {
        unique.set(key, food);
      }
    });
  });
  return Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name));
})();

export function scaleNutrients(food: Food, grams: number): Nutrients {
  const factor = grams / 100;
  return {
    calories: food.nutrients.calories * factor,
    protein: food.nutrients.protein * factor,
    carbs: food.nutrients.carbs * factor,
    fat: food.nutrients.fat * factor,
    fiber: food.nutrients.fiber * factor,
    iron: food.nutrients.iron * factor,
  };
}
