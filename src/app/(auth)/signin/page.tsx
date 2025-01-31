"use client";

import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function SignIn() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const error = searchParams.get("error");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false,
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      router.push(callbackUrl);
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Enter your credentials to access your dashboard
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-500">
          {error === "CredentialsSignin"
            ? "Invalid email or password"
            : "An error occurred during sign in"}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Email Address
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-500 transition-colors focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
            placeholder="Enter your email"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-500 transition-colors focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
            placeholder="Enter your password"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              type="checkbox"
              name="remember"
              checked={formData.remember}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-2 focus:ring-purple-200"
            />
            <label className="ml-2 text-sm text-gray-600">
              Remember me
            </label>
          </div>
          <a
            href="#"
            className="text-sm font-medium text-purple-600 hover:text-purple-500 transition-colors"
          >
            Forgot password?
          </a>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2.5 text-white transition-all hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Signing in...
            </span>
          ) : (
            "Sign in"
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-sm">
        <span className="text-gray-600">Don't have an account?</span>
        <a href="/register" className="ml-1 font-medium text-purple-600 hover:text-purple-500 transition-colors">
          Sign up
        </a>
      </div>
    </>
  );
}
