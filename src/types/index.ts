export interface Nutrition {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  sugar: number;
  salt: number;
  potassium?: number;
}

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
  nutrition: Nutrition;
  estimatedPeople: number;
  cuisineType: string;
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
