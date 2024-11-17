// pages/meal-plan/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ChefHat, 
  ListChecks, 
  ShoppingCart, 
  PlusCircle,
  ArrowRight 
} from "lucide-react";
import Header from "@/components/Header";

interface MealPlan {
  date: string;
  meals: {
    type: string;
    name: string;
    calories: number;
  }[];
}

interface GroceryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  checked: boolean;
}

export default function MealPlanHome() {
  const [todaysMeals, setTodaysMeals] = useState<MealPlan | null>(null);
  const [groceryList, setGroceryList] = useState<GroceryItem[]>([]);
  const [stats, setStats] = useState({
    totalPlannedMeals: 0,
    weeklyCalories: 0,
    groceryItems: 0,
  });

  useEffect(() => {
    // TODO: Fetch from Firebase
    // Mock data for now
    setTodaysMeals({
      date: new Date().toISOString(),
      meals: [
        { type: "Breakfast", name: "Oatmeal with Berries", calories: 350 },
        { type: "Lunch", name: "Chicken Caesar Salad", calories: 450 },
        { type: "Dinner", name: "Grilled Salmon with Vegetables", calories: 600 },
      ],
    });

    setGroceryList([
      { id: "1", name: "Oatmeal", quantity: 1, unit: "package", checked: false },
      { id: "2", name: "Berries", quantity: 2, unit: "cups", checked: false },
    ]);
  }, []);

  return (
    <div className="min-h-screen bg-base-100">
        <Header />
      <div className="max-w-7xl mx-auto space-y-8 p-8 pt-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-primary mb-2">Meal Planning Hub</h1>
          <p className="text-base-content/70">Plan, track, and organize your meals</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/meal-plan/generate">
            <div className="card bg-primary text-primary-content hover:shadow-lg transition-all">
              <div className="card-body">
                <ChefHat className="w-8 h-8 mb-2" />
                <h2 className="card-title">Generate Meal Plan</h2>
                <p>Create a personalized meal plan based on your preferences</p>
                <div className="card-actions justify-end">
                  <ArrowRight className="w-6 h-6" />
                </div>
              </div>
            </div>
          </Link>

          <Link href="/meal-plan/foods">
            <div className="card bg-secondary text-secondary-content hover:shadow-lg transition-all">
              <div className="card-body">
                <ListChecks className="w-8 h-8 mb-2" />
                <h2 className="card-title">Food List</h2>
                <p>Manage your available ingredients and preferences</p>
                <div className="card-actions justify-end">
                  <ArrowRight className="w-6 h-6" />
                </div>
              </div>
            </div>
          </Link>

          <Link href="/meal-plan/grocery">
            <div className="card bg-accent text-accent-content hover:shadow-lg transition-all">
              <div className="card-body">
                <ShoppingCart className="w-8 h-8 mb-2" />
                <h2 className="card-title">Grocery List</h2>
                <p>View and manage your shopping list</p>
                <div className="card-actions justify-end">
                  <ArrowRight className="w-6 h-6" />
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Today's Meals */}
        {todaysMeals && (
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-primary mb-4">Today's Meals</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {todaysMeals.meals.map((meal, index) => (
                  <div key={index} className="bg-base-100 p-4 rounded-lg">
                    <h3 className="font-bold text-base-content">{meal.type}</h3>
                    <p className="text-base-content">{meal.name}</p>
                    <p className="text-base-content/70">{meal.calories} calories</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Grocery List Preview */}
        {groceryList.length > 0 && (
          <div className="card bg-primary-content shadow-xl">
            <div className="card-body">
              <div className="flex justify-between items-center mb-4">
                <h2 className="card-title text-primary">Shopping List</h2>
                <Link href="/meal-plan/grocery">
                  <button className="btn btn-primary btn-sm">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Add Items
                  </button>
                </Link>
              </div>
              <div className="divide-y divide-base-300">
                {groceryList.slice(0, 5).map((item) => (
                  <div key={item.id} className="py-2 text-primary flex justify-between items-center">
                    <span>{item.name}</span>
                    <span className="text-primary/70">
                      {item.quantity} {item.unit}
                    </span>
                  </div>
                ))}
              </div>
              {groceryList.length > 5 && (
                <div className="text-center mt-4">
                  <Link href="/meal-plan/grocery" className="text-primary hover:underline">
                    View all {groceryList.length} items
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}