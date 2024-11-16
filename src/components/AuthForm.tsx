"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

const AuthForm = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isRegistering, setIsRegistering] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleAuth = async () => {
        setLoading(true);
        setError("");
        try {
            if (isRegistering) {
                await createUserWithEmailAndPassword(auth, email, password);
                alert("Account created successfully!");
                setIsRegistering(false);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
                window.location.href = "/";
            }
        } catch (error) {
            setError((error as any).message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-base-200 pt-16">
            <div className="w-full max-w-md bg-base-100 p-8 rounded-lg shadow-lg">
                <h2 className="text-2xl text-primary font-bold text-center mb-6">
                    {isRegistering ? "Register" : "Login"}
                </h2>
                
                <div className="space-y-4">
                    {error && (
                        <div className="alert alert-error">
                            <span>{error}</span>
                        </div>
                    )}
                    <div>
                        <label htmlFor="email" className="block text-sm font-semibold text-gray-700">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input input-bordered w-full mt-1"
                            placeholder="Enter your email"
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="password" className="block text-sm font-semibold text-gray-700">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input input-bordered w-full mt-1"
                            placeholder="Enter your password"
                        />
                    </div>

                    <button
                        onClick={handleAuth}
                        disabled={loading}
                        className={`btn btn-primary w-full mt-4 ${loading ? "loading" : ""}`}
                    >
                        {loading ? "Processing..." : isRegistering ? "Register" : "Login"}
                    </button>
                    
                    <p className="mt-4 text-center text-sm text-gray-600">
                        {isRegistering
                            ? "Already have an account? "
                            : "Don't have an account? "}
                        <span
                            onClick={() => setIsRegistering(!isRegistering)}
                            className="text-primary cursor-pointer"
                        >
                            {isRegistering ? "Login here" : "Register now"}
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AuthForm;
