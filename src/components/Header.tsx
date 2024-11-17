"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { themeChange } from "theme-change";
import { useAuth } from "@/lib/authContext";
import { useRouter } from "next/router";
import { Dumbbell } from "lucide-react";

const Header = () => {
  const { authUser, loading, logout } = useAuth();
  //   const router = useRouter();

    themeChange(false);
    useEffect(() => {
    // if (!authUser) router.push("/");

    themeChange(false);
    // 👆 false parameter is required for react project
  }, []);

  return (
    <header className="flex justify-between items-center p-4 bg-base-300 text-base-content">
      <Link href="/" className="text-accent text-xl font-bold flex items-center space-x-2">
        <Dumbbell />
        <span>Workout Web App</span>
      </Link>
      <h2 className="text-accent">
        {loading ? "Loading..." : authUser ? `Welcome, ${authUser.email}` : ""}
      </h2>
      <div className="flex items-center space-x-4">
        <select data-choose-theme className="p-2 rounded text-primary">
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
        {!authUser ? (
          <Link href="/auth">
            <div className="p-2 bg-primary text-primary-content rounded">
              Login / Sign Up
            </div>
          </Link>
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
  );
};

export default Header;
