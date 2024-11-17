// pages/about.tsx
"use client";

import { Calendar, ForkKnifeCrossed, Github, Instagram, LineChart, Twitter } from "lucide-react";
import { useState, useEffect } from "react";
import { themeChange } from "theme-change";
import Link from "next/link";

export default function About() {
    themeChange(false);
    
  useEffect(() => {
    themeChange(false);
  }, []);

  return (
    <div className="min-h-screen bg-base-100">
      {/* Hero Section */}
      <Link href="/" className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 z-0" />
        <div className="container mx-auto px-4 z-10 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            A New Solution To An Old Problem
          </h1>
          <p className="text-xl md:text-2xl text-base-content/80 max-w-2xl mx-auto">
            Reinventing the wheel has never looked so good
          </p>
        </div>
      </Link>

      {/* Features Grid */}
      <section className="py-20 bg-base-200">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Me?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="card bg-base-100 text-base-content shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                <div className="card-body">
                  <feature.icon />
                  <h3 className="card-title">{feature.title}</h3>
                  <p className="text-base-content/70">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index} className="space-y-2">
                <div className="text-4xl font-bold text-primary">{stat.value}</div>
                <div className="text-base-content/70">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8">Ready to Start Your Journey?</h2>
          <Link 
            href="/auth" 
            className="btn btn-primary btn-lg"
          >
            Join Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-base-300 p-4 text-center absolute  w-full">
        <select
          data-choose-theme
          className="p-2 rounded text-primary absolute bottom-[50%] right-2 translate-y-[50%]"
        >
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
        <p className="text-sm text-gray-600">2024 Workout Web App.</p>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: () => <Calendar className="w-12 h-12 text-base-content mb-4 self-center"/>,
    title: "Smart Scheduling",
    description: "An intuitive drag-and-drop interface with recovery tracking."
  },
  {
    icon: () => <LineChart className="w-12 h-12 text-base-content mb-4 self-center" />,
    title: "Progress Tracking",
    description: "Visual insights into your fitness journey with detailed analytics"
  },
  {
    icon: () => <ForkKnifeCrossed className="w-12 h-12 text-base-content mb-4 self-center" />,
    title: "Meal Planning",
    description: "Personalized meal plans and recipes that not only hit your goals but minimize cost."
  }
];

const stats = [
  { value: "1", label: "Active-ish Users" },
  { value: "> 2", label: "Workouts Completed" },
  { value: "98%", label: "Satisfaction Rate" },
  { value: "24/0", label: "Support" }
];