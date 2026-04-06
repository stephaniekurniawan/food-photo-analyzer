export interface MealRecord {
  seq: string; country: string; residence: string; sex: string; age: number;
  income: string; marriage: string; child: string; job: string;
  description: string; analysis: string; photoUrl: string; colors: string[];
  weight: number; sugar: number; salt: number; potassium: number;
  calories: number; protein: number; fat: number; carbs: number; fiber: number;
  servings: number; cuisine: string; companion: string;
}
export interface Filters {
  markets: string[]; cuisine: string; companion: string; sex: string;
  marriage: string; child: string; minCal: number; maxCal: number;
}
