import { LargeNumberLike } from "crypto";

export enum GenerateType {
  OnlyIncrease = "increase",
  OnlyDecrease = "decrease",
  KeepEqual = "equal",
  AnyWithinBounds = "bounded-any",
}

export enum MealReason {
  Manual = "manual",
  Generated = "generated",
}

export enum FoodType {
  Ingredient = "Ingredient",
  Food = "Basic Food",
  Recipe = "Recipe",
  Meal = "Meal",
}

interface PersistentGeneratable {
  type: FoodType;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  cost: number;
  // store: string; //! ??
  min_serving: number;
  max_serving: number;
  serving_step: number;
  enabled: boolean;
  required: boolean;
  display_group?: string;
  group?: string; //! Rename generate_group
  units?: number;
  unit_name?: string;
}

interface LocalGeneratable extends PersistentGeneratable {
  key?: string; //! Used for React key (generated)
  draggable_id?: string; //! Used for Draggable key (generated)
  servings?: number; //* Number of servings generated (local)
  meal_display_group?: string; //* Group that food is dragged into (local)
  inMeal?: boolean; //* Used to track if food dragged in meal (local)
  mealReason?: MealReason; //* Used to track how food got to meal (local)
  generateType?: GenerateType; //* Track what changes to make to food in generation, to be enum (local) ?
  usingFoodUnits?: boolean; //* Whether to use food units or servings in generation (local)
}

export interface BasicFood extends LocalGeneratable {
  type: FoodType.Food;
  nutritionix_data?: any; // Extra data tacked on from Nutritionix API
}

export interface Recipe extends LocalGeneratable {
  type: FoodType.Recipe;
  makes_servings: number;
  ingredients: Array<{
    item: BasicFood | Recipe;
    quantity: number;
    usingFoodUnits: boolean;
  }>;
  instructions?: string[];
}

export interface Meal extends LocalGeneratable {
  type: FoodType.Meal;
  components: Array<{
    item: BasicFood | Recipe | Meal;
    quantity: number;
    usingFoodUnits: boolean;
  }>;
}

// Factory function to create BasicFood with optional initial values
export function createBasicFood(initialValues: Partial<BasicFood> = {}): BasicFood {
  return {
    type: FoodType.Food,
    name: "",
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    cost: 0,
    min_serving: 1,
    max_serving: 1,
    serving_step: 1,
    enabled: true,
    required: false,
    ...initialValues, // Merge the initial values with defaults
  };
}

// Factory function to create Recipe with optional initial values
export function createRecipe(initialValues: Partial<Recipe> = {}): Recipe {
  return {
    type: FoodType.Recipe,
    name: "",
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    cost: 0,
    min_serving: 1,
    max_serving: 1,
    serving_step: 1,
    enabled: true,
    required: false,
    makes_servings: 1,
    ingredients: [],
    instructions: [],
    ...initialValues, // Merge the initial values with defaults
  };
}

// Factory function to create Meal with optional initial values
export function createMeal(initialValues: Partial<Meal> = {}): Meal {
  return {
    type: FoodType.Meal,
    name: "",
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    cost: 0,
    min_serving: 1,
    max_serving: 1,
    serving_step: 1,
    enabled: true,
    required: false,
    components: [],
    ...initialValues, // Merge the initial values with defaults
  };
}

export type FoodItem = BasicFood | Recipe | Meal;

export interface GeneratorList {
  id: number;
  name: string;
  items: FoodItem[];
}

export interface Range {
  min: number;
  max: number;
  total: number;
}

export type GoalOptions = "Calories" | "Fat" | "Carbs" | "Protein";

export type GoalRanges = {
  [key in GoalOptions]: Range;
};

// {
//   Calories: Range;
//   Fat: Range;
//   Carbs: Range;
//   Protein: Range;
// }
