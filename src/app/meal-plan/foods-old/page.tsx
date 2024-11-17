"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus,
  Minus,
  X,
  RotateCcw,
  Download,
  Copy,
  Save,
  Search,
  Camera,
  Loader2,
} from "lucide-react";
import axios from "axios";
import Quagga from "@ericblade/quagga2";
// import debounce from "lodash/debounce";
import {
  BasicFood,
  createBasicFood,
  FoodType,
  createMeal,
  createRecipe,
  Recipe,
  FoodItem,
  Meal,
} from "@/lib/food-definitions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import { useAuth } from "@/lib/authContext";

interface SearchResult {
  food_name: string;
  brand_name?: string;
  serving_unit: string;
  serving_qty: number;
  nf_calories: number;
  photo: { thumb: string };
  tag_id?: string;
  nix_item_id?: string;
}

// const initialBasicForm = createBasicFood();
const initialBasicForm = {
  type: FoodType.Food,
  name: "",
  enabled: true,
  required: false,
  display_group: "",
  group: "",
  cost: "",
  calories: "",
  carbs: "",
  fat: "",
  protein: "",
  min_serving: "",
  max_serving: "",
  serving_step: "",
  units: "",
  unit_name: "",
};
const initialRecipeForm = {
  type: FoodType.Recipe,
  name: "",
  enabled: true,
  required: false,
  display_group: "",
  group: "",
  ingredients: [],
  instructions: [],
  cost: "",
  calories: "",
  carbs: "",
  fat: "",
  protein: "",
  min_servings: "",
  max_servings: "",
  serving_step: "",
  units: "",
  unit_name: "",
};

const initialMealForm = {
  type: FoodType.Meal,
  name: "",
  enabled: true,
  required: false,
  display_group: "",
  group: "",
  components: [],
  cost: "",
  calories: "",
  carbs: "",
  fat: "",
  protein: "",
  min_servings: "",
  max_servings: "",
  serving_step: "",
  units: "",
  unit_name: "",
};

type FirebaseFood = FoodItem & {
  userId: string;
};

export default function FoodsEditor() {
  function debounce<F extends (...args: any[]) => any>(
    func: F,
    delay: number
  ): (...args: Parameters<F>) => void {
    let timeoutId: NodeJS.Timeout;

    return (...args: Parameters<F>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
      }, delay);
    };
  }

  const [foods, setFoods] = useState<{ [key: string]: FoodItem }>({});
  const [basicForm, setBasicForm] = useState<BasicFood>(initialBasicForm);
  const [recipeForm, setRecipeForm] = useState<Recipe>(initialRecipeForm);
  const [mealForm, setMealForm] = useState<Meal>(initialMealForm);
  const [instruction, setInstruction] = useState("");
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBarcodeDialogOpen, setIsBarcodeDialogOpen] = useState(false);
  const videoRef = useRef<HTMLDivElement>(null); //useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tab, setTab] = useState("basic");
  const [searchTab, setSearchTab] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Firebase Support
  const [isFirebaseLoading, setIsFirebaseLoading] = useState(false);
  const { authUser } = useAuth();

  // const storedFoods = localStorage.getItem("foods");
  // if (storedFoods) {
  //   const storedFoodsObj = JSON.parse(storedFoods);
  //   for (let key in storedFoodsObj) {
  //     if (typeof storedFoodsObj[key].cost != "number")
  //       delete storedFoodsObj[key];
  //     if (
  //       storedFoodsObj[key].type == undefined ||
  //       storedFoodsObj[key].type == "Food"
  //     )
  //       storedFoodsObj[key].type = FoodType.Food;

  //     const draggableId = encodeURIComponent(key);
  //     storedFoodsObj[key].key = draggableId;
  //   }

  //   setFoods(storedFoodsObj);
  // }

  const loadFoodsFromFirebase = async () => {
    if (!authUser?.uid) return;
    setIsFirebaseLoading(true);
    try {
      const foodsRef = collection(db, "foods");
      const q = query(foodsRef, where("userId", "==", authUser.uid));
      const querySnapshot = await getDocs(q);
      const foods: {} = {};
      querySnapshot.forEach((doc) => {
        const foodData = doc.data() as FirebaseFood;

        // Old compatibility things
        if (typeof foodData.cost != "number") return;

        if (foodData.type == undefined || foodData.type == "Food")
          foodData.type = FoodType.Food;

        const draggableId = encodeURIComponent(foodData.name);
        foodData.key = draggableId;

        // key: doc.id,
        foods[foodData.name] = foodData;
      });
      setFoods(foods);
    } catch (error) {
      console.error("Error loading foods:", error);
      setError("Failed to load foods");
    } finally {
      setIsFirebaseLoading(false);
    }
  };

  const saveFoodToFirebase = async (food: FoodItem) => {
    if (!authUser?.uid) return;
    try {
      const foodRef = doc(db, "foods", food.key);
      await setDoc(foodRef, {
        ...food,
        userId: authUser.uid,
      });
      await loadFoodsFromFirebase(); // Reload foods after save
    } catch (error) {
      console.error("Error saving food:", error);
      setError("Failed to save food");
    }
  };

  const deleteFoodFromFirebase = async (foodKey: string) => {
    if (!authUser?.uid) return;
    try {
      await deleteDoc(doc(db, "foods", foodKey));
      await loadFoodsFromFirebase(); // Reload foods after delete
    } catch (error) {
      console.error("Error deleting food:", error);
      setError("Failed to delete food");
    }
  };

  const NUTRITIONIX_APP_ID = process.env.NEXT_PUBLIC_NUTRITIONIX_APP_ID;
  const NUTRITIONIX_API_KEY = process.env.NEXT_PUBLIC_NUTRITIONIX_API_KEY;

  const allFoods = Object.values(foods).sort((foodA, foodB) =>
    foodA.name.localeCompare(foodB.name)
  );

  const basicFoods = Object.values(foods)
    .filter((food) => food.type == undefined || food.type == FoodType.Food)
    .sort((foodA, foodB) => foodA.name.localeCompare(foodB.name));

  const recipeSafe = Object.values(foods)
    .filter(
      (food) => food.type == FoodType.Food || food.type == FoodType.Recipe
    )
    .sort((foodA, foodB) => foodA.name.localeCompare(foodB.name));

  const recipes = Object.values(foods)
    .filter((food) => food.type == FoodType.Recipe)
    .sort((foodA, foodB) => foodA.name.localeCompare(foodB.name));

  const meals = Object.values(foods)
    .filter((food) => food.type == FoodType.Meal)
    .sort((foodA, foodB) => foodA.name.localeCompare(foodB.name));

  // Update useEffect to load from Firebase
  useEffect(() => {
    loadFoodsFromFirebase();
  }, [authUser]);

  // useEffect(() => {
  //   const storedFoods = localStorage.getItem("foods");
  //   if (storedFoods) {
  //     const storedFoodsObj = JSON.parse(storedFoods);
  //     for (let key in storedFoodsObj) {
  //       if (typeof storedFoodsObj[key].cost != "number")
  //         delete storedFoodsObj[key];
  //       if (
  //         storedFoodsObj[key].type == undefined ||
  //         storedFoodsObj[key].type == "Food"
  //       )
  //         storedFoodsObj[key].type = FoodType.Food;

  //       const draggableId = encodeURIComponent(key);
  //       storedFoodsObj[key].key = draggableId;
  //     }

  //     setFoods(storedFoodsObj);
  //   }
  // }, []);

  useEffect(() => {
    if (!isBarcodeDialogOpen) {
      stopBarcodeScanner();
    }
  }, [isBarcodeDialogOpen]);

  const updateIngredient = (
    index: number,
    field: string,
    value: any,
    type: FoodType
  ) => {
    if (type == FoodType.Meal) {
      const newForm = { ...mealForm };
      newForm.components[index] = {
        ...newForm.components[index],
        [field]: value,
      };
      setMealForm(newForm);
    } else if (type == FoodType.Recipe) {
      const newForm = { ...recipeForm };
      newForm.ingredients[index] = {
        ...newForm.ingredients[index],
        [field]: value,
      };
      setRecipeForm(newForm);
    }
  };

  const removeIngredient = (index: number, foodType: FoodType) => {
    if (foodType == FoodType.Recipe) {
      const newForm = { ...recipeForm };
      newForm.ingredients = newForm.ingredients.filter((_, i) => i !== index);
      setRecipeForm(newForm);
    } else if (foodType == FoodType.Meal) {
      const newForm = { ...mealForm };
      console.log(newForm);
      newForm.components = newForm.components.filter((_, i) => i !== index);
      setMealForm(newForm);
      console.log(newForm);
    }
  };

  const addIngredient = (food: FoodItem, foodType: FoodType) => {
    if (foodType == FoodType.Recipe) {
      const newForm = { ...recipeForm };
      newForm.ingredients = [
        ...newForm.ingredients,
        {
          item: food as BasicFood | Recipe,
          quantity: 1,
          usingFoodUnits: false,
        },
      ];
      setRecipeForm(newForm);
    } else if (foodType == FoodType.Meal) {
      const newForm = { ...mealForm };
      newForm.components = [
        ...newForm.components,
        { item: food, quantity: 1, usingFoodUnits: false },
      ];
      setMealForm(newForm);
    }
  };

  const addInstruction = () => {
    setRecipeForm({
      ...recipeForm,
      instructions: [...recipeForm.instructions, instruction],
    });
    setInstruction("");
  };

  const removeInstruction = (index: number) => {
    const newForm = { ...recipeForm };
    newForm.instructions = newForm.instructions.filter((_, i) => i !== index);
    setRecipeForm(newForm);
  };

  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (query.length < 3) return;
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get(
          `https://trackapi.nutritionix.com/v2/search/instant?query=${query}`,
          {
            headers: {
              "x-app-id": NUTRITIONIX_APP_ID,
              "x-app-key": NUTRITIONIX_API_KEY,
            },
          }
        );
        const combinedResults = [
          ...response.data.common,
          ...response.data.branded,
        ];
        const uniqueResults = combinedResults.reduce(
          (acc: SearchResult[], current) => {
            const x = acc.find((item) => item.tag_id === current.tag_id);
            if (!x) {
              return acc.concat([current]);
            } else {
              return acc;
            }
          },
          []
        );
        setSearchResults(uniqueResults);
      } catch (error) {
        setError("Error searching the nutrition database. Please try again.");
        console.error("Error searching nutrition database:", error);
      }
      setIsLoading(false);
    }, 300),
    []
  );

  useEffect(() => {
    debouncedSearch(searchTerm);
  }, [searchTerm, debouncedSearch]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFormFunction: any
  ) => {
    const { name, value, type, checked } = e.target;
    setFormFunction((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
          ? parseFloat(value)
          : value,
    }));
  };

  // const handleSubmit = (e: React.FormEvent, type: FoodType) => {
  //   e.preventDefault();
  //   if (type == FoodType.Food) {
  //     console.log(basicForm);
  //     basicForm.key = encodeURIComponent(basicForm.name);
  //     const newFoods = { ...foods, [basicForm.name]: basicForm };
  //     setFoods(newFoods);
  //     localStorage.setItem("foods", JSON.stringify(newFoods));
  //     setBasicForm(initialBasicForm);
  //   } else if (type == FoodType.Recipe) {
  //     recipeForm.key = encodeURIComponent(recipeForm.name);
  //     const newFoods = { ...foods, [recipeForm.name]: recipeForm };
  //     setFoods(newFoods);
  //     localStorage.setItem("foods", JSON.stringify(newFoods));
  //     setRecipeForm(initialRecipeForm);
  //   } else if (type == FoodType.Meal) {
  //     mealForm.key = encodeURIComponent(mealForm.name);
  //     const newFoods = { ...foods, [mealForm.name]: mealForm };
  //     setFoods(newFoods);
  //     localStorage.setItem("foods", JSON.stringify(newFoods));
  //     setMealForm(initialMealForm);
  //   }
  // };

  // Firebase Supported handleSubmit
  const handleSubmit = async (e: React.FormEvent, type: FoodType) => {
    e.preventDefault();
    const form =
      type === FoodType.Food
        ? basicForm
        : type === FoodType.Recipe
        ? recipeForm
        : mealForm;

    const newFood: FoodItem = {
      key: form.name.toLowerCase().replace(/\s+/g, "-"),
      ...form,
      type,
    };

    await saveFoodToFirebase(newFood);

    // Reset form
    if (type === FoodType.Food) {
      setBasicForm(initialBasicForm);
    } else if (type === FoodType.Recipe) {
      setRecipeForm(initialRecipeForm);
    } else {
      setMealForm(initialMealForm);
    }
  };

  const loadFood = (name: string) => {
    const food = foods[name];
    console.log(food);
    switch (food.type) {
      case FoodType.Recipe: {
        setRecipeForm(food);
        setTab("recipe");
        console.log(recipeForm);
        break;
      }
      case FoodType.Meal: {
        setMealForm(food);
        setTab("meal");
        break;
      }
      case FoodType.Food:
      default: {
        food.type = FoodType.Food;
        setBasicForm(food);
        setTab("basic");
        break;
      }
    }
  };

  // const deleteFood = (name: string) => {
  //   const newFoods = { ...foods };
  //   delete newFoods[name];
  //   setFoods(newFoods);
  //   localStorage.setItem("foods", JSON.stringify(newFoods));
  // };

  // Firebase Supported deleteFood
  const deleteFood = async (foodKey: string) => {
    await deleteFoodFromFirebase(foodKey);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setSearchTab(null);
    }
  };

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchTab]);

  const downloadJSON = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(foods));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "foods.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/json") {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const jsonData = JSON.parse(event.target?.result as string);
          setFoods(jsonData);
          // localStorage.setItem("foods", JSON.stringify(jsonData));
          for (let key in jsonData) {
            const oldFood = jsonData[key];
            const newFood: FoodItem = {
              key: oldFood.name.toLowerCase().replace(/\s+/g, '-'),
              ...oldFood
            };

            await saveFoodToFirebase(newFood);
          }
          alert("File parsed successfully!");
        } catch (error) {
          alert("Error parsing JSON: " + error);
        }
      };
      reader.readAsText(file);
    } else {
      alert("Please drop a valid JSON file.");
    }
  };

  const addSearchResult = async (item: SearchResult) => {
    // setIsSearchDialogOpen(false); // Better here??
    setIsLoading(true);
    setError(null);
    try {
      let detailedData;
      if (item.nix_item_id) {
        const response = await axios.get(
          `https://trackapi.nutritionix.com/v2/search/item?nix_item_id=${item.nix_item_id}`,
          {
            headers: {
              "x-app-id": process.env.NEXT_PUBLIC_NUTRITIONIX_APP_ID,
              "x-app-key": process.env.NEXT_PUBLIC_NUTRITIONIX_API_KEY,
            },
          }
        );
        detailedData = response.data.foods[0];
      } else {
        const response = await axios.post(
          "https://trackapi.nutritionix.com/v2/natural/nutrients",
          { query: item.food_name },
          {
            headers: {
              "x-app-id": process.env.NEXT_PUBLIC_NUTRITIONIX_APP_ID,
              "x-app-key": process.env.NEXT_PUBLIC_NUTRITIONIX_API_KEY,
            },
          }
        );
        detailedData = response.data.foods[0];
      }
      const newFood: BasicFood = createBasicFood({
        name: detailedData.food_name,
        cost: 0, // Set a default cost or prompt user to enter
        calories: detailedData.nf_calories,
        carbs: detailedData.nf_total_carbohydrate,
        fat: detailedData.nf_total_fat,
        protein: detailedData.nf_protein,
        min_serving: 1,
        max_serving: 5,
        serving_step: 0.5,
        group: "",
        display_group: "",
        required: false,
        enabled: true,
        nutritionix_data: detailedData,
      });
      setIsSearchDialogOpen(false);
      setBasicForm(newFood);
      setSearchResults([]);
      setSearchTerm("");
    } catch (error) {
      setError(
        "Error fetching detailed nutrition information. Please try again."
      );
      console.error("Error fetching nutrition details:", error);
    }
    setIsLoading(false);
  };

  const round = (num: number, fractionDigits: number): number => {
    return Number(num.toFixed(fractionDigits));
  };

  const calculateNutrition = (foodType: FoodType) => {
    let totalNutrition = {
      cost: 0,
      calories: 0,
      carbs: 0,
      fat: 0,
      protein: 0,
    };
    if (foodType == FoodType.Recipe && recipeForm) {
      let items = recipeForm.ingredients;

      if (Number.isNaN(recipeForm.makes_servings))
        recipeForm.makes_servings = 1;

      items.forEach((item) => {
        const quantity =
          item.usingFoodUnits && item.item.units && item.item.unit_name
            ? item.quantity / item.item.units
            : item.quantity;
        totalNutrition.cost += round(item.item.cost * quantity, 1);
        totalNutrition.calories += round(item.item.calories * quantity, 1);
        totalNutrition.carbs += round(item.item.carbs * quantity, 1);
        totalNutrition.fat += round(item.item.fat * quantity, 1);
        totalNutrition.protein += round(item.item.protein * quantity, 1);
      });

      totalNutrition.cost /= recipeForm.makes_servings;
      totalNutrition.calories /= recipeForm.makes_servings;
      totalNutrition.carbs /= recipeForm.makes_servings;
      totalNutrition.fat /= recipeForm.makes_servings;
      totalNutrition.protein /= recipeForm.makes_servings;

      setRecipeForm({
        ...recipeForm,
        ...totalNutrition,
        ingredients: items,
      });
    } else if (foodType == FoodType.Meal && mealForm) {
      let items = mealForm.components;

      items.forEach((item) => {
        const quantity =
          item.usingFoodUnits && item.item.units && item.item.unit_name
            ? item.quantity / item.item.units
            : item.quantity;
        totalNutrition.cost += round(item.item.cost * quantity, 1);
        totalNutrition.calories += round(item.item.calories * quantity, 1);
        totalNutrition.carbs += round(item.item.carbs * quantity, 1);
        totalNutrition.fat += round(item.item.fat * quantity, 1);
        totalNutrition.protein += round(item.item.protein * quantity, 1);
      });

      setMealForm({
        ...mealForm,
        ...totalNutrition,
        components: items,
      });
    }
  };

  const startBarcodeScanner = () => {
    Quagga.init(
      {
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: videoRef.current as HTMLDivElement, // We know it is specified
        },
        decoder: {
          readers: ["ean_reader", "ean_8_reader", "upc_reader", "upc_e_reader"],
        },
      },
      (err) => {
        if (err) {
          console.error("Error starting Quagga:", err);
          setError("Error starting barcode scanner. Please try again.");
          return;
        }
        Quagga.start();
      }
    );

    Quagga.onDetected(handleBarcodeDetected);
  };

  const stopBarcodeScanner = () => {
    Quagga.stop();
  };

  const handleBarcodeDetected = async (result: any) => {
    stopBarcodeScanner();
    const barcode = result.codeResult.code;
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `https://trackapi.nutritionix.com/v2/search/item?upc=${barcode}`,
        {
          headers: {
            "x-app-id": NUTRITIONIX_APP_ID,
            "x-app-key": NUTRITIONIX_API_KEY,
          },
        }
      );
      const foodData = response.data.foods[0];
      const newFood: BasicFood = createBasicFood({
        name: foodData.food_name,
        cost: 0, // Set a default cost or prompt user to enter
        calories: foodData.nf_calories,
        carbs: foodData.nf_total_carbohydrate,
        fat: foodData.nf_total_fat,
        protein: foodData.nf_protein,
        min_serving: 1,
        max_serving: 5,
        serving_step: 0.5,
        group: "",
        display_group: "",
        required: false,
        enabled: true,
        nutritionix_data: foodData,
      });
      setBasicForm(newFood);
      setIsBarcodeDialogOpen(false);
    } catch (error) {
      setError(
        "Error fetching product information. Please try again or enter details manually."
      );
      console.error("Error fetching product information:", error);
    }
    setIsLoading(false);
  };

  const onTabChange = (value: string) => {
    setTab(value);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Food Editor</h1>

      <Tabs value={tab} onValueChange={onTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Basic Food</TabsTrigger>
          <TabsTrigger value="recipe">Recipe</TabsTrigger>
          <TabsTrigger value="meal">Meal</TabsTrigger>
        </TabsList>
        <TabsContent value="basic">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Basic Food</CardTitle>
              <CardDescription>Add/Edit Basic Food</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => handleSubmit(e, FoodType.Food)}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="col-span-1 md:col-span-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      type="text"
                      id="name"
                      name="name"
                      value={basicForm.name ?? ""}
                      onChange={(e) => handleInputChange(e, setBasicForm)}
                      required
                      placeholder="Hamburger"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cost">Cost ($)</Label>
                    <Input
                      type="number"
                      id="cost"
                      name="cost"
                      value={basicForm.cost ?? ""}
                      onChange={(e) => handleInputChange(e, setBasicForm)}
                      required
                      step="0.01"
                      placeholder="1.99"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="calories">Calories</Label>
                    <Input
                      type="number"
                      id="calories"
                      name="calories"
                      value={basicForm.calories}
                      onChange={(e) => handleInputChange(e, setBasicForm)}
                      required
                      min="0"
                      placeholder="0"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="carbs">Carbs (g)</Label>
                    <Input
                      type="number"
                      id="carbs"
                      name="carbs"
                      value={basicForm.carbs}
                      onChange={(e) => handleInputChange(e, setBasicForm)}
                      required
                      min="0"
                      step="0.1"
                      placeholder="0"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="fat">Fat (g)</Label>
                    <Input
                      type="number"
                      id="fat"
                      name="fat"
                      value={basicForm.fat}
                      onChange={(e) => handleInputChange(e, setBasicForm)}
                      required
                      min="0"
                      step="0.1"
                      placeholder="0"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="protein">Protein (g)</Label>
                    <Input
                      type="number"
                      id="protein"
                      name="protein"
                      value={basicForm.protein}
                      onChange={(e) => handleInputChange(e, setBasicForm)}
                      required
                      min="0"
                      step="0.1"
                      placeholder="0"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <Label htmlFor="min_serving">Min Servings</Label>
                    <Input
                      type="number"
                      id="min_serving"
                      name="min_serving"
                      value={basicForm.min_serving}
                      onChange={(e) => handleInputChange(e, setBasicForm)}
                      min="0.5"
                      step="0.5"
                      placeholder="1"
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="max_serving">Max Servings</Label>
                    <Input
                      type="number"
                      id="max_serving"
                      name="max_serving"
                      value={basicForm.max_serving}
                      onChange={(e) => handleInputChange(e, setBasicForm)}
                      min="0.5"
                      step="0.5"
                      placeholder="1"
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="serving_step">Serving Step</Label>
                    <Input
                      type="number"
                      id="serving_step"
                      name="serving_step"
                      value={basicForm.serving_step}
                      onChange={(e) => handleInputChange(e, setBasicForm)}
                      min="0.5"
                      step="0.5"
                      placeholder="0.5"
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="units">Units</Label>
                    <Input
                      type="number"
                      id="units"
                      name="units"
                      value={basicForm.units ?? ""}
                      onChange={(e) => handleInputChange(e, setBasicForm)}
                      min="0.1"
                      step="0.1"
                      placeholder="1"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="unit_name">Unit Name</Label>
                    <Input
                      type="text"
                      id="unit_name"
                      name="unit_name"
                      value={basicForm.unit_name ?? ""}
                      onChange={(e) => handleInputChange(e, setBasicForm)}
                      placeholder="g"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="group">Group</Label>
                    <Input
                      type="text"
                      id="group"
                      name="group"
                      value={basicForm.group ?? ""}
                      onChange={(e) => handleInputChange(e, setBasicForm)}
                      placeholder="proteinBar"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="display_group">Display Group</Label>
                    <Input
                      type="text"
                      id="display_group"
                      name="display_group"
                      value={basicForm.display_group ?? ""}
                      onChange={(e) => handleInputChange(e, setBasicForm)}
                      placeholder="Dinner"
                      list="display-groups"
                      className="mt-1"
                    />
                    <datalist id="display-groups">
                      <option value="Breakfast" />
                      <option value="Lunch" />
                      <option value="Dinner" />
                      <option value="Snacks" />
                    </datalist>
                  </div>
                  <div className="flex items-center space-x-4 mt-6 justify-evenly">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="required"
                        name="required"
                        checked={basicForm.required}
                        onCheckedChange={(checked) =>
                          setBasicForm((prev) => ({
                            ...prev,
                            required: checked as boolean,
                          }))
                        }
                      />
                      <Label htmlFor="required">Required</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="enabled"
                        name="enabled"
                        checked={basicForm.enabled}
                        onCheckedChange={(checked) =>
                          setBasicForm((prev) => ({
                            ...prev,
                            enabled: checked as boolean,
                          }))
                        }
                      />
                      <Label htmlFor="enabled">Enabled</Label>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button type="submit" className="w-full md:w-auto">
                    Add/Update Food
                  </Button>
                  <Dialog
                    open={isSearchDialogOpen}
                    onOpenChange={setIsSearchDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full md:w-auto">
                        <Search className="w-4 h-4 mr-2" />
                        Search Database
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Search Nutrition Database</DialogTitle>
                      </DialogHeader>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="text"
                          placeholder="Search for a food..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                      {error && <p className="text-red-500 mt-2">{error}</p>}
                      <ScrollArea className="h-[300px] mt-4">
                        {isLoading ? (
                          <div className="flex justify-center items-center h-full">
                            <Loader2 className="w-6 h-6 animate-spin" />
                          </div>
                        ) : (
                          searchResults.map((result, index) => (
                            <div
                              key={index}
                              className="p-4 hover:bg-gray-100 cursor-pointer border-b"
                              onClick={() => addSearchResult(result)}
                            >
                              <div className="flex items-center">
                                <img
                                  src={result.photo.thumb}
                                  alt={result.food_name}
                                  className="w-12 h-12 object-cover rounded mr-4"
                                />
                                <div>
                                  <h3 className="font-bold text-lg">
                                    {result.food_name}
                                  </h3>
                                  {result.brand_name && (
                                    <p className="text-sm text-gray-600">
                                      Brand: {result.brand_name}
                                    </p>
                                  )}
                                  <p className="text-sm">
                                    Serving: {result.serving_qty}{" "}
                                    {result.serving_unit}
                                  </p>
                                  <p className="text-sm">
                                    Calories: {result.nf_calories}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                  <Dialog
                    open={isBarcodeDialogOpen}
                    onOpenChange={setIsBarcodeDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full md:w-auto">
                        <Camera className="w-4 h-4 mr-2" />
                        Scan Barcode
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Scan Barcode</DialogTitle>
                      </DialogHeader>
                      <div className="flex flex-col items-center">
                        <div ref={videoRef} className="w-full max-w-sm mb-4" />
                        <Button
                          onClick={startBarcodeScanner}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "Start Scanning"
                          )}
                        </Button>
                        {error && <p className="text-red-500 mt-2">{error}</p>}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="recipe">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Recipe</CardTitle>
              <CardDescription>Add/Edit Recipe</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => handleSubmit(e, FoodType.Recipe)}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="col-span-1 md:col-span-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      type="text"
                      id="name"
                      name="name"
                      value={recipeForm.name}
                      onChange={(e) => handleInputChange(e, setRecipeForm)}
                      required
                      placeholder="Hamburger"
                      className="mt-1"
                    />
                  </div>{" "}
                  <div>
                    <Label htmlFor="makes_servings">
                      Makes How Many Servings
                    </Label>
                    <Input
                      type="number"
                      id="makes_servings"
                      name="makes_servings"
                      value={recipeForm.makes_servings}
                      onChange={(e) => handleInputChange(e, setRecipeForm)}
                      placeholder="0"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label>Ingredients</Label>
                  {recipeForm.ingredients.map((ing, index) => (
                    <div
                      key={`r-${index}-${ing.item.key}-${ing.quantity}-${ing.usingFoodUnits}`}
                      className="flex items-center space-x-2 mt-2"
                    >
                      <Button
                        type="button"
                        onClick={() => removeIngredient(index, FoodType.Recipe)}
                        variant="destructive"
                        size="icon"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <div className="grow font-normal leading-relaxed ">
                        {ing.item ? ing.item.name : ""}
                      </div>
                      <Input
                        type="number"
                        value={ing.quantity ? ing.quantity : ""}
                        onChange={(e) =>
                          updateIngredient(
                            index,
                            "quantity",
                            parseFloat(e.target.value),
                            FoodType.Recipe
                          )
                        }
                        className="w-20"
                      />
                      {ing.usingFoodUnits ? (
                        <div className="text-muted-foreground">
                          {"/ " + ing.item.units + " " + ing.item.unit_name}
                        </div>
                      ) : (
                        <></>
                      )}
                      <Label>
                        {" "}
                        <Button
                          type="button"
                          variant="link"
                          disabled={!ing.usingFoodUnits}
                          onClick={(e) => {
                            updateIngredient(
                              index,
                              "usingFoodUnits",
                              false,
                              FoodType.Recipe
                            );
                            updateIngredient(
                              index,
                              "quantity",
                              ing.quantity / (ing.item.units as number),
                              FoodType.Recipe
                            );
                          }}
                          className={
                            !ing.usingFoodUnits
                              ? "bg-neutral-200 dark:bg-neutral-800"
                              : ""
                          }
                        >
                          Servings
                        </Button>{" "}
                        {ing.item != undefined &&
                        ing.item.units != undefined &&
                        ing.item.unit_name != undefined ? (
                          <>
                            {" "}
                            or{" "}
                            <Button
                              type="button"
                              variant="link"
                              disabled={ing.usingFoodUnits}
                              onClick={(e) => {
                                updateIngredient(
                                  index,
                                  "usingFoodUnits",
                                  true,
                                  FoodType.Recipe
                                );
                                updateIngredient(
                                  index,
                                  "quantity",
                                  ing.quantity * (ing.item.units as number),
                                  FoodType.Recipe
                                );
                              }}
                              className={
                                ing.usingFoodUnits
                                  ? "bg-neutral-200 dark:bg-neutral-800"
                                  : ""
                              }
                            >
                              {ing.item.unit_name}
                            </Button>
                          </>
                        ) : (
                          <></>
                        )}
                      </Label>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="default"
                    onClick={() =>
                      setSearchTab(searchTab == "recipe" ? null : "recipe")
                    }
                    className="flex items-center mt-3 w-full"
                  >
                    {searchTab === "recipe" ? (
                      <X className="h-4 w-4 mr-1" />
                    ) : (
                      <Plus className="h-4 w-4 mr-1" />
                    )}
                    {searchTab === "recipe" ? "Close" : "Add Ingredient"}
                  </Button>{" "}
                  {searchTab === "recipe" && (
                    // Add "absolute if want overlay food items"
                    <div className="w-full z-20">
                      <Command
                        onKeyDown={handleSearchKeyDown}
                        className="border"
                      >
                        <CommandInput
                          placeholder="Search..."
                          ref={searchInputRef}
                        />
                        <CommandList>
                          <CommandEmpty>No results found.</CommandEmpty>
                          {recipeSafe.map((food, index) => (
                            <CommandItem
                              key={food.name}
                              onSelect={() =>
                                addIngredient(food, FoodType.Recipe)
                              }
                            >
                              {food.name}
                            </CommandItem>
                          ))}
                        </CommandList>
                      </Command>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="instructions">Instructions</Label>
                  <Textarea
                    id="instructions"
                    value={instruction}
                    onChange={(e) => setInstruction(e.target.value)}
                    className="mb-2"
                  />
                  <Button
                    type="button"
                    variant="default"
                    onClick={addInstruction}
                    className="flex items-center mt-3 w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Instruction
                  </Button>
                  {recipeForm == undefined ? (
                    <></>
                  ) : (
                    (recipeForm.instructions as []).map((inst, index) => (
                      <div
                        className="flex space-x-2 space-y-2 items-center justify-between"
                        key={`instruction-${index}`}
                      >
                        <div>
                          {index + 1}. {inst}
                        </div>
                        <Button
                          type="button"
                          onClick={() => removeInstruction(index)}
                          className="w-full md:w-auto"
                          variant="destructive"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>

                <Separator className="my-4" />
                {/* All Food Items */}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="min_serving">Min Servings</Label>
                    <Input
                      type="number"
                      id="min_serving"
                      name="min_serving"
                      value={recipeForm.min_serving}
                      onChange={(e) => handleInputChange(e, setRecipeForm)}
                      min="0.5"
                      step="0.5"
                      placeholder="1"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="max_serving">Max Servings</Label>
                    <Input
                      type="number"
                      id="max_serving"
                      name="max_serving"
                      value={recipeForm.max_serving}
                      onChange={(e) => handleInputChange(e, setRecipeForm)}
                      min="0.5"
                      step="0.5"
                      placeholder="1"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="serving_step">Serving Step</Label>
                    <Input
                      type="number"
                      id="serving_step"
                      name="serving_step"
                      value={recipeForm.serving_step}
                      onChange={(e) => handleInputChange(e, setRecipeForm)}
                      min="0.5"
                      step="0.5"
                      placeholder="0.5"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="group">Group</Label>
                    <Input
                      type="text"
                      id="group"
                      name="group"
                      value={recipeForm.group}
                      onChange={(e) => handleInputChange(e, setRecipeForm)}
                      placeholder="proteinBar"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="display_group">Display Group</Label>
                    <Input
                      type="text"
                      id="display_group"
                      name="display_group"
                      value={recipeForm.display_group}
                      onChange={(e) => handleInputChange(e, setRecipeForm)}
                      placeholder="Dinner"
                      list="display-groups"
                      className="mt-1"
                    />
                    <datalist id="display-groups">
                      <option value="Breakfast" />
                      <option value="Lunch" />
                      <option value="Dinner" />
                      <option value="Snacks" />
                    </datalist>
                  </div>
                  <div className="flex items-center space-x-4 mt-6 justify-evenly">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="required"
                        name="required"
                        checked={recipeForm.required}
                        onCheckedChange={(checked) =>
                          setRecipeForm((prev) => ({
                            ...prev,
                            required: checked as boolean,
                          }))
                        }
                      />
                      <Label htmlFor="required">Required</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="enabled"
                        name="enabled"
                        checked={recipeForm.enabled}
                        onCheckedChange={(checked) =>
                          setRecipeForm((prev) => ({
                            ...prev,
                            enabled: checked as boolean,
                          }))
                        }
                      />
                      <Label htmlFor="enabled">Enabled</Label>
                    </div>
                  </div>
                </div>

                {/* GENERATED ITEMS */}

                <Separator className="my-4" />
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <Label htmlFor="calories">Calories</Label>
                    <Input
                      type="number"
                      id="calories"
                      name="calories"
                      value={recipeForm.calories}
                      onChange={(e) => handleInputChange(e, setRecipeForm)}
                      required
                      min="0"
                      placeholder="0"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="carbs">Carbs (g)</Label>
                    <Input
                      type="number"
                      id="carbs"
                      name="carbs"
                      value={recipeForm.carbs}
                      onChange={(e) => handleInputChange(e, setRecipeForm)}
                      required
                      min="0"
                      step="0.1"
                      placeholder="0"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="fat">Fat (g)</Label>
                    <Input
                      type="number"
                      id="fat"
                      name="fat"
                      value={recipeForm.fat}
                      onChange={(e) => handleInputChange(e, setRecipeForm)}
                      required
                      min="0"
                      step="0.1"
                      placeholder="0"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="protein">Protein (g)</Label>
                    <Input
                      type="number"
                      id="protein"
                      name="protein"
                      value={recipeForm.protein}
                      onChange={(e) => handleInputChange(e, setRecipeForm)}
                      required
                      min="0"
                      step="0.1"
                      placeholder="0"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cost">Cost ($)</Label>
                    <Input
                      type="number"
                      id="cost"
                      name="cost"
                      value={recipeForm.cost}
                      onChange={(e) => handleInputChange(e, setRecipeForm)}
                      required
                      step="0.01"
                      placeholder="1.99"
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={(e) => calculateNutrition(FoodType.Recipe)}
                  >
                    Calculate Nutrition & Cost
                  </Button>
                  <Button type="submit" className="w-full md:w-auto">
                    Add/Update Recipe
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="meal">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Meal</CardTitle>
              <CardDescription>Add/Edit Meal</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => handleSubmit(e, FoodType.Meal)}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="col-span-1 md:col-span-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      type="text"
                      id="name"
                      name="name"
                      value={mealForm.name}
                      onChange={(e) => handleInputChange(e, setMealForm)}
                      required
                      placeholder="Hamburger"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label>Components</Label>
                  {mealForm.components.map((ing, index) => (
                    <div
                      key={`m-${index}-${ing.item.key}-${ing.quantity}-${ing.usingFoodUnits}`}
                      className="flex items-center space-x-2 mt-2"
                    >
                      <Button
                        type="button"
                        onClick={() => removeIngredient(index, FoodType.Meal)}
                        variant="destructive"
                        size="icon"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <div className="grow font-normal leading-relaxed ">
                        {ing.item ? ing.item.name : ""}
                      </div>

                      {/* <Select
                          onValueChange={(value) =>
                            updateIngredient(
                              index,
                              "item",
                              foods[value],
                              FoodType.Meal
                            )
                          }
                          value={ing.item ? ing.item.name : ""}
                        >
                          <SelectTrigger className="grow w-1">
                            <SelectValue placeholder="Select ingredient" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(allFoods).map(([id, food]) => (
                              <SelectItem
                                key={`m-${index}-${food.key}`}
                                value={food.name}
                              >
                                {food.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select> */}
                      <Input
                        type="number"
                        value={ing.quantity ? ing.quantity : ""}
                        onChange={(e) =>
                          updateIngredient(
                            index,
                            "quantity",
                            parseFloat(e.target.value),
                            FoodType.Meal
                          )
                        }
                        className="w-20"
                      />
                      {ing.usingFoodUnits ? (
                        <div className="text-muted-foreground">
                          {"/ " + ing.item.units + " " + ing.item.unit_name}
                        </div>
                      ) : (
                        <></>
                      )}
                      <Label>
                        {" "}
                        <Button
                          type="button"
                          variant="link"
                          disabled={!ing.usingFoodUnits}
                          onClick={(e) => {
                            updateIngredient(
                              index,
                              "usingFoodUnits",
                              false,
                              FoodType.Meal
                            );
                            updateIngredient(
                              index,
                              "quantity",
                              ing.quantity / (ing.item.units as number),
                              FoodType.Meal
                            );
                          }}
                          className={
                            !ing.usingFoodUnits
                              ? "bg-neutral-200 dark:bg-neutral-800"
                              : ""
                          }
                        >
                          Servings
                        </Button>{" "}
                        {ing.item != undefined &&
                        ing.item.units != undefined &&
                        ing.item.unit_name != undefined ? (
                          <>
                            {" "}
                            or{" "}
                            <Button
                              type="button"
                              variant="link"
                              disabled={ing.usingFoodUnits}
                              onClick={(e) => {
                                updateIngredient(
                                  index,
                                  "usingFoodUnits",
                                  true,
                                  FoodType.Meal
                                );
                                updateIngredient(
                                  index,
                                  "quantity",
                                  ing.quantity * (ing.item.units as number),
                                  FoodType.Meal
                                );
                              }}
                              className={
                                ing.usingFoodUnits
                                  ? "bg-neutral-200 dark:bg-neutral-800"
                                  : ""
                              }
                            >
                              {ing.item.unit_name}
                            </Button>
                          </>
                        ) : (
                          <></>
                        )}
                      </Label>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="default"
                    onClick={() =>
                      setSearchTab(searchTab == "meal" ? null : "meal")
                    }
                    className="flex items-center mt-3 w-full"
                  >
                    {searchTab === "meal" ? (
                      <X className="h-4 w-4 mr-1" />
                    ) : (
                      <Plus className="h-4 w-4 mr-1" />
                    )}
                    {searchTab === "meal" ? "Close" : "Add Ingredient"}
                  </Button>{" "}
                  {searchTab === "meal" && (
                    // Add "absolute if want overlay food items"
                    <div className="w-full z-20">
                      <Command
                        onKeyDown={handleSearchKeyDown}
                        className="border"
                      >
                        <CommandInput
                          placeholder="Search..."
                          ref={searchInputRef}
                        />
                        <CommandList>
                          <CommandEmpty>No results found.</CommandEmpty>
                          {allFoods.map((food, index) => (
                            <CommandItem
                              key={food.name}
                              onSelect={() =>
                                addIngredient(food, FoodType.Meal)
                              }
                            >
                              {food.name}
                            </CommandItem>
                          ))}
                        </CommandList>
                      </Command>
                    </div>
                  )}
                </div>

                {/* <div>
                    <Label htmlFor="servings">Servings</Label>
                    <Input
                      type="number"
                      id="servings"
                      name="servings"
                      value={mealForm.servings}
                      onChange={(e) => handleInputChange(e, setMealForm)}
                      required
                    />
                  </div> */}

                <Separator className="my-4" />
                {/* All Food Items */}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="min_serving">Min Servings</Label>
                    <Input
                      type="number"
                      id="min_serving"
                      name="min_serving"
                      value={mealForm.min_serving}
                      onChange={(e) => handleInputChange(e, setMealForm)}
                      min="0.5"
                      step="0.5"
                      placeholder="1"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="max_serving">Max Servings</Label>
                    <Input
                      type="number"
                      id="max_serving"
                      name="max_serving"
                      value={mealForm.max_serving}
                      onChange={(e) => handleInputChange(e, setMealForm)}
                      min="0.5"
                      step="0.5"
                      placeholder="1"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="serving_step">Serving Step</Label>
                    <Input
                      type="number"
                      id="serving_step"
                      name="serving_step"
                      value={mealForm.serving_step}
                      onChange={(e) => handleInputChange(e, setMealForm)}
                      min="0.5"
                      step="0.5"
                      placeholder="0.5"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="group">Group</Label>
                    <Input
                      type="text"
                      id="group"
                      name="group"
                      value={mealForm.group}
                      onChange={(e) => handleInputChange(e, setMealForm)}
                      placeholder="proteinBar"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="display_group">Display Group</Label>
                    <Input
                      type="text"
                      id="display_group"
                      name="display_group"
                      value={mealForm.display_group}
                      onChange={(e) => handleInputChange(e, setMealForm)}
                      placeholder="Dinner"
                      list="display-groups"
                      className="mt-1"
                    />
                    <datalist id="display-groups">
                      <option value="Breakfast" />
                      <option value="Lunch" />
                      <option value="Dinner" />
                      <option value="Snacks" />
                    </datalist>
                  </div>
                  <div className="flex items-center space-x-4 mt-6 justify-evenly">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="required"
                        name="required"
                        checked={mealForm.required}
                        onCheckedChange={(checked) =>
                          setMealForm((prev) => ({
                            ...prev,
                            required: checked as boolean,
                          }))
                        }
                      />
                      <Label htmlFor="required">Required</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="enabled"
                        name="enabled"
                        checked={mealForm.enabled}
                        onCheckedChange={(checked) =>
                          setMealForm((prev) => ({
                            ...prev,
                            enabled: checked as boolean,
                          }))
                        }
                      />
                      <Label htmlFor="enabled">Enabled</Label>
                    </div>
                  </div>
                </div>

                {/* GENERATED ITEMS */}

                <Separator className="my-4" />
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <Label htmlFor="calories">Calories</Label>
                    <Input
                      type="number"
                      id="calories"
                      name="calories"
                      value={mealForm.calories}
                      onChange={(e) => handleInputChange(e, setMealForm)}
                      required
                      min="0"
                      placeholder="0"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="carbs">Carbs (g)</Label>
                    <Input
                      type="number"
                      id="carbs"
                      name="carbs"
                      value={mealForm.carbs}
                      onChange={(e) => handleInputChange(e, setMealForm)}
                      required
                      min="0"
                      step="0.1"
                      placeholder="0"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="fat">Fat (g)</Label>
                    <Input
                      type="number"
                      id="fat"
                      name="fat"
                      value={mealForm.fat}
                      onChange={(e) => handleInputChange(e, setMealForm)}
                      required
                      min="0"
                      step="0.1"
                      placeholder="0"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="protein">Protein (g)</Label>
                    <Input
                      type="number"
                      id="protein"
                      name="protein"
                      value={mealForm.protein}
                      onChange={(e) => handleInputChange(e, setMealForm)}
                      required
                      min="0"
                      step="0.1"
                      placeholder="0"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cost">Cost ($)</Label>
                    <Input
                      type="number"
                      id="cost"
                      name="cost"
                      value={mealForm.cost}
                      onChange={(e) => handleInputChange(e, setMealForm)}
                      required
                      step="0.01"
                      placeholder="1.99"
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={(e) => calculateNutrition(FoodType.Meal)}
                  >
                    Calculate Nutrition & Cost
                  </Button>
                  <Button type="submit" className="w-full md:w-auto">
                    Add/Update Recipe
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {isFirebaseLoading ? (
        <div className="text-center py-4">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Basic Food List</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Calories</TableHead>
                      <TableHead>Carbs</TableHead>
                      <TableHead>Fat</TableHead>
                      <TableHead>Protein</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.values(basicFoods).map((food) => (
                      <TableRow key={food.name}>
                        <TableCell>
                          {food.name}
                          {food.unit_name && food.units
                            ? ` - ${food.units} ${food.unit_name}`
                            : ""}
                        </TableCell>
                        <TableCell>${food.cost.toFixed(2)}</TableCell>
                        <TableCell>{food.calories}</TableCell>
                        <TableCell>{food.carbs}g</TableCell>
                        <TableCell>{food.fat}g</TableCell>
                        <TableCell>{food.protein}g</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              onClick={() => loadFood(food.name)}
                              variant="outline"
                              size="sm"
                            >
                              Edit
                            </Button>
                            <Button
                              onClick={() => deleteFood(food.name)}
                              variant="destructive"
                              size="sm"
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recipe List</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Calories</TableHead>
                      <TableHead>Carbs</TableHead>
                      <TableHead>Fat</TableHead>
                      <TableHead>Protein</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.values(recipes).map((food) => (
                      <TableRow key={food.name}>
                        <TableCell>
                          {food.name}
                          {food.unit_name && food.units
                            ? ` - ${food.units} ${food.unit_name}`
                            : ""}
                        </TableCell>
                        <TableCell>${food.cost.toFixed(2)}</TableCell>
                        <TableCell>{food.calories}</TableCell>
                        <TableCell>{food.carbs}g</TableCell>
                        <TableCell>{food.fat}g</TableCell>
                        <TableCell>{food.protein}g</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              onClick={() => loadFood(food.name)}
                              variant="outline"
                              size="sm"
                            >
                              Edit
                            </Button>
                            <Button
                              onClick={() => deleteFood(food.name)}
                              variant="destructive"
                              size="sm"
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Meal List</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Calories</TableHead>
                      <TableHead>Carbs</TableHead>
                      <TableHead>Fat</TableHead>
                      <TableHead>Protein</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.values(meals).map((food) => (
                      <TableRow key={food.name}>
                        <TableCell>
                          {food.name}
                          {food.unit_name && food.units
                            ? ` - ${food.units} ${food.unit_name}`
                            : ""}
                        </TableCell>
                        <TableCell>${food.cost.toFixed(2)}</TableCell>
                        <TableCell>{food.calories}</TableCell>
                        <TableCell>{food.carbs}g</TableCell>
                        <TableCell>{food.fat}g</TableCell>
                        <TableCell>{food.protein}g</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              onClick={() => loadFood(food.name)}
                              variant="outline"
                              size="sm"
                            >
                              Edit
                            </Button>
                            <Button
                              onClick={() => deleteFood(food.name)}
                              variant="destructive"
                              size="sm"
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <div
        className="mt-8 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleFileDrop}
      >
        <p className="text-lg text-gray-600">Drop JSON files here to import</p>
      </div>

      <div className="fixed bottom-4 right-4 flex space-x-2">
        <Button onClick={downloadJSON}>
          <Download className="h-4 w-4 mr-2" />
          Download JSON
        </Button>
        <Button
          onClick={() => localStorage.setItem("foods", JSON.stringify(foods))}
        >
          <Save className="h-4 w-4 mr-2" />
          Save to Browser
        </Button>
      </div>
    </div>
  );
}
