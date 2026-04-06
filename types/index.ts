export interface FoodPhoto {
  seq: number;
  country: string;
  residence: string;
  sex: string;
  age: number;
  income: string;
  marriage: string;
  child: string;
  job: string;
  filename: string;
  description: string;
  analysisText: string;
  photoUrl: string;
  colors: string[];
  nutrition: {
    calories: number; protein: number; fat: number; carbs: number;
    fiber: number; sugar: number; salt: number; potassium: number;
  };
  estimatedPeople: number;
  cuisineType: string;
  healthScore?: number;
  peopleCategory: string;
  diningCompanion: string;
}
export interface Filters {
  sex: string[];
  ageRange: [number, number];
  marriage: string[];
  child: string[];
  incomeLevel: string[];
  residence: string[];
  cuisineType: string[];
  selectedColors: string[];
}
export interface AnalysisResult {
  nutrition: { calories: number; protein: number; fat: number; carbs: number; fiber: number; sugar: number; salt: number; potassium: number; };
  colors: string[];
  plateCount: number;
  estimatedPeople: number;
  cuisineType: string;
  healthScore: number;
  description: string;
  ingredients: string[];
}
