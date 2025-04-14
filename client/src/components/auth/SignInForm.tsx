"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const SignInForm = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const { login, error, loading } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(formData.username, formData.password);
  };

  return (
    <div className="rounded-xl border border-stroke bg-white p-8 shadow-default dark:border-gray-800 dark:bg-gray-900/50 sm:px-11 sm:py-11">
      <h2 className="mb-2 text-2xl font-semibold text-gray-900 dark:text-white">
        Sign In
      </h2>
      <p className="mb-8 text-sm text-gray-500 dark:text-gray-400">
        Sign in to your account to start using the app
      </p>

      {error && (
        <div className="mb-5 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="mb-2.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Username
          </label>
          <div className="relative">
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="Enter your username"
              className="w-full rounded-lg border border-gray-300 bg-transparent py-3 pl-4 pr-10 text-gray-800 outline-none focus:border-primary focus-visible:shadow-none dark:border-gray-700 dark:text-white"
            />
            <span className="absolute right-4 top-3 text-gray-500 dark:text-gray-400">
              <svg
                className="fill-current"
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9.00002 9C11.0842 9 12.7725 7.3115 12.7725 5.2275C12.7725 3.1435 11.0842 1.455 9.00002 1.455C6.91602 1.455 5.22752 3.1435 5.22752 5.2275C5.22752 7.3115 6.91602 9 9.00002 9Z"
                  fill=""
                />
                <path
                  d="M10.5576 10.5488H7.44263C4.13263 10.5488 1.45312 13.2283 1.45312 16.5383C1.45312 16.7963 1.66362 17.0068 1.92163 17.0068H16.0786C16.3366 17.0068 16.5471 16.7963 16.5471 16.5383C16.5471 13.2283 13.8676 10.5488 10.5576 10.5488Z"
                  fill=""
                />
              </svg>
            </span>
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-2.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Password
          </label>
          <div className="relative">
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
              className="w-full rounded-lg border border-gray-300 bg-transparent py-3 pl-4 pr-10 text-gray-800 outline-none focus:border-primary focus-visible:shadow-none dark:border-gray-700 dark:text-white"
            />
            <span className="absolute right-4 top-3 text-gray-500 dark:text-gray-400">
              <svg
                className="fill-current"
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 5.32275C7.0325 5.32275 5.46 6.89525 5.46 8.86275C5.46 9.67275 5.7325 10.4028 6.1875 10.9903L6.3825 11.2153H11.6175L11.8125 10.9903C12.2675 10.4403 12.54 9.67275 12.54 8.86275C12.54 6.8953 10.9675 5.32275 9 5.32275ZM9 10.3053C7.695 10.3053 6.6 9.21025 6.6 7.90525C6.6 6.60025 7.695 5.50525 9 5.50525C10.305 5.50525 11.4 6.60025 11.4 7.90525C11.4 9.21025 10.305 10.3053 9 10.3053Z"
                  fill=""
                />
                <path
                  d="M9 0.226562C4.0875 0.226562 0.1125 4.20156 0.1125 9.11406C0.1125 14.0266 4.0875 18.0016 9 18.0016C13.9125 18.0016 17.8875 14.0266 17.8875 9.11406C17.8875 4.20156 13.9125 0.226562 9 0.226562ZM9 16.4266C4.935 16.4266 1.725 13.1791 1.725 9.11406C1.725 5.04906 4.935 1.80156 9 1.80156C13.065 1.80156 16.275 5.04906 16.275 9.11406C16.275 13.1791 13.065 16.4266 9 16.4266Z"
                  fill=""
                />
              </svg>
            </span>
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="rememberMe"
              className="h-4 w-4 border-gray-300 bg-gray-100 text-primary focus:ring-2 focus:ring-primary"
            />
            <label
              htmlFor="rememberMe"
              className="ml-2 text-sm font-medium text-gray-600 dark:text-gray-400"
            >
              Remember me
            </label>
          </div>
          <Link
            href="#"
            className="text-sm font-medium text-primary hover:underline"
          >
            Forgot Password?
          </Link>
        </div>

        <div className="mb-6">
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-lg bg-primary py-3 px-9 text-center font-medium text-white hover:bg-primary/90 disabled:bg-primary/70"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </div>
      </form>

      <p className="text-center text-sm font-medium text-gray-600 dark:text-gray-400">
        Don&apos;t have an account?{' '}
        <Link
          href="/auth/signup"
          className="text-primary hover:underline"
        >
          Sign Up
        </Link>
      </p>
    </div>
  );
};

export default SignInForm;
