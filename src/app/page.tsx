"use client";

import { Activity, Calendar, Star, Dumbbell, MoveUpRight, Carrot, CookingPot } from 'lucide-react';

import { useState, useEffect } from "react";
import Link from "next/link";
import { themeChange } from "theme-change";
import { useAuth } from "@/lib/authContext";


const Homepage = () => {
  const { authUser, loading, logout } = useAuth();
  //   const router = useRouter();

  useEffect(() => {
    // if (!authUser) router.push("/");

    themeChange(false);
    // 👆 false parameter is required for react project
  }, []);

  return (
    <div className="min-h-screen bg-base-100">
      {/* Custom Header */}
      <header className="flex justify-between items-center p-4">
      <Link href="/" className="text-accent text-4xl font-bold flex items-center space-x-2">
        <Dumbbell className='w-8 h-8' />
        <span>Workout Web App</span>
      </Link>
      <div className="flex items-center space-x-4 text-accent text-lg ms-20 me-auto brightness-75">
      <Link href="/about">
        <span>About</span>
      </Link>
      <Link href="/meal-plan">
        <span>Meal Planner</span>
      </Link>
      </div>
      <div className="flex items-center space-x-4">
        {!authUser ? (
          <div className='flex items-center space-x-2'>
          <Link href="/auth">
            <div className="p-4 bg-primary text-primary-content rounded-full">
              Join The Buzz Word
            </div>
          </Link>
          <Link href="/auth">
            <div className="p-4 bg-primary text-primary-content rounded-full">
              <MoveUpRight className="w-8 h-8" />
            </div>
          </Link>
          </div>
        ) : (
          <button
            className="p-2 bg-secondary text-secondary-content rounded"
            onClick={() => {
              logout();
              console.log("Logging out...");
            }}
          >
            Logout
          </button>
        )}
      </div>
    </header>
      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto p-8 grid grid-cols-2 gap-6">
        {/* Hero Section */}
        <div className="bg-primary text-primary-content p-8 rounded-2xl shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <Activity className="h-5 w-5" />
            <span className="text-sm font-semibold">FITNESS TRACKER — 2024</span>
          </div>
          <h1 className="text-5xl font-bold leading-tight mb-6">
            TRACK YOUR<br />PROGRESS,<br />ACHIEVE MORE
          </h1>
          <Link href="/" className="btn btn-secondary ghost">
            START YOUR JOURNEY
          </Link>
          <div className="mt-4 flex items-center space-x-2 text-sm">
            <Calendar className="h-4 w-4" />
            <span>PERSONALIZED FITNESS EXPERIENCE</span>
          </div>
        </div>

        {/* Stats Card */}
        <div className="bg-gradient-to-br from-primary to-secondary p-8 rounded-2xl text-secondary-content flex flex-col justify-end">
          <h2 className="text-2xl font-bold mb-2">TRAIN ON YOUR SCHEDULE</h2>
          <p className="">Flexible workout plans that adapt to your lifestyle</p>
        </div>

        {/* Support Section */}
        <Link href="/" className="bg-accent p-6 rounded-2xl shadow-lg flex items-center space-x-4 text-accent-content hover:bg-accent-focus transition duration-300 ease-in-out transform hover:scale-105">
          <CookingPot className="w-16 h-16"/>
          <div>
            <p className="text-sm font-medium">Meal Plan Generation</p>
            <h3 className="text-xl font-bold">MINIMAL COST, MAXIMAL FIT</h3>
          </div>
        </Link>

        {/* Ratings & Features */}
        <div className="bg-primary text-primary-content p-6 rounded-2xl shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-4xl font-bold">Another Feature</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {['Meal Planning', 'Workout Tracking', 'Progress Stats'].map((feature) => (
              <span key={feature} className="px-4 py-2 bg-secondary text-secondary-content rounded-full text-sm">
                {feature}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-base-300 p-4 text-center fixed bottom-0 w-full">
        <select data-choose-theme className="p-2 rounded text-primary absolute bottom-[50%] right-2 translate-y-[50%]">
          <option value="light">Light Mode</option>
          <option value="dark">Dark Mode</option>
          <option value="cupcake">Cupcake</option>
          <option value="bumblebee">Bumblebee</option>
          <option value="emerald">Emerald</option>
          <option value="corporate">Corporate</option>
          <option value="synthwave">Synthwave</option>
          <option value="retro">Retro</option>
          <option value="cyberpunk">Cyberpunk</option>
          <option value="valentine">Valentine</option>
          <option value="halloween">Halloween</option>
          <option value="garden">Garden</option>
          <option value="forest">Forest</option>
          <option value="aqua">Aqua</option>
          <option value="lofi">Lofi</option>
          <option value="pastel">Pastel</option>
          <option value="fantasy">Fantasy</option>
          <option value="wireframe">Wireframe</option>
          <option value="black">Black</option>
          <option value="luxury">Luxury</option>
          <option value="dracula">Dracula</option>
          <option value="cmyk">CMYK</option>
          <option value="autumn">Autumn</option>
          <option value="business">Business</option>
          <option value="acid">Acid</option>
          <option value="lemonade">Lemonade</option>
          <option value="night">Night</option>
          <option value="coffee">Coffee</option>
          <option value="winter">Winter</option>
          <option value="dim">Dim</option>
          <option value="nord">Nord</option>
          <option value="sunset">Sunset</option>
          <option value="">System Default</option>
        </select>
        <p className="text-sm text-gray-600">
          2024 Workout Web App.
        </p>
      </footer>
    </div>
  );
};

export default Homepage;
