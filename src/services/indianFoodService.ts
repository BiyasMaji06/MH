const datasets = [
  require('../data/foods.json'),
  require('../data/foods-simple.json'),
  require('../data/animal-meat.json'),
  require('../data/cereals-and-millets.json'),
  require('../data/condiments-and-spices.json'),
  require('../data/edible-oils-and-fats.json'),
  require('../data/egg-and-egg-products.json'),
  require('../data/fresh-water-fish-and-shellfish.json'),
  require('../data/fruits.json'),
  require('../data/grain-legumes.json'),
  require('../data/green-leafy-vegetables.json'),
  require('../data/marine-fish.json'),
  require('../data/marine-mollusks.json'),
  require('../data/marine-shellfish.json'),
  require('../data/milk-and-milk-products.json'),
  require('../data/miscellaneous-foods.json'),
  require('../data/mushrooms.json'),
  require('../data/nuts-and-oil-seeds.json'),
  require('../data/other-vegetables.json'),
  require('../data/poultry.json'),
  require('../data/roots-and-tubers.json'),
  require('../data/sugars.json'),
];

function extractFoods(data: any): any[] {
  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.foods)) return data.foods;

  for (const value of Object.values(data ?? {})) {
    if (Array.isArray(value)) return value;
  }

  return [];
}

const allFoods = Array.from(
  new Map(
    datasets
      .flatMap(extractFoods)
      .map((food) => [
        JSON.stringify(food),
        food,
      ]),
  ).values(),
);

export function searchIndianFoods(query: string) {
  const search = query.trim().toLowerCase();

  if (!search) return [];

  return allFoods
    .filter((food) => {
      const name =
        food.name ??
        food.food_name ??
        food.foodName ??
        food.description ??
        '';

      return String(name).toLowerCase().includes(search);
    })
    .slice(0, 30);
}

export function getIndianFoodCount() {
  return allFoods.length;
}
