"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const SignUpForm = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    address: '',
    position: '',
    department: '',
  });
  
  const [passwordMatch, setPasswordMatch] = useState(true);
  const { register, error, loading } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    if (name === 'confirmPassword' || name === 'password') {
      if (name === 'confirmPassword') {
        setPasswordMatch(formData.password === value);
      } else {
        setPasswordMatch(formData.confirmPassword === value);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setPasswordMatch(false);
      return;
    }
    
    // Omit confirmPassword from the data sent to the backend
    const { confirmPassword, ...registerData } = formData;
    await register(registerData);
  };

  return (
    <div className="rounded-xl border border-stroke bg-white p-8 shadow-default dark:border-gray-800 dark:bg-gray-900/50 sm:px-11 sm:py-11">
      <h2 className="mb-2 text-2xl font-semibold text-gray-900 dark:text-white">
        Sign Up
      </h2>
      <p className="mb-8 text-sm text-gray-500 dark:text-gray-400">
        Create your account to start using the app
      </p>

      {error && (
        <div className="mb-5 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              First Name
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              placeholder="Enter your first name"
              className="w-full rounded-lg border border-gray-300 bg-transparent py-3 px-4 text-gray-800 outline-none focus:border-primary focus-visible:shadow-none dark:border-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-2.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Last Name
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              placeholder="Enter your last name"
              className="w-full rounded-lg border border-gray-300 bg-transparent py-3 px-4 text-gray-800 outline-none focus:border-primary focus-visible:shadow-none dark:border-gray-700 dark:text-white"
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="mb-2.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Username
          </label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            placeholder="Enter your username"
            className="w-full rounded-lg border border-gray-300 bg-transparent py-3 px-4 text-gray-800 outline-none focus:border-primary focus-visible:shadow-none dark:border-gray-700 dark:text-white"
          />
        </div>

        <div className="mb-6">
          <label className="mb-2.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="Enter your email"
            className="w-full rounded-lg border border-gray-300 bg-transparent py-3 px-4 text-gray-800 outline-none focus:border-primary focus-visible:shadow-none dark:border-gray-700 dark:text-white"
          />
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Phone Number
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="Enter your phone number"
              className="w-full rounded-lg border border-gray-300 bg-transparent py-3 px-4 text-gray-800 outline-none focus:border-primary focus-visible:shadow-none dark:border-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-2.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Department
            </label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
              placeholder="Enter your department"
              className="w-full rounded-lg border border-gray-300 bg-transparent py-3 px-4 text-gray-800 outline-none focus:border-primary focus-visible:shadow-none dark:border-gray-700 dark:text-white"
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="mb-2.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Position
          </label>
          <input
            type="text"
            name="position"
            value={formData.position}
            onChange={handleChange}
            placeholder="Enter your position"
            className="w-full rounded-lg border border-gray-300 bg-transparent py-3 px-4 text-gray-800 outline-none focus:border-primary focus-visible:shadow-none dark:border-gray-700 dark:text-white"
          />
        </div>

        <div className="mb-6">
          <label className="mb-2.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Address
          </label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Enter your address"
            className="w-full rounded-lg border border-gray-300 bg-transparent py-3 px-4 text-gray-800 outline-none focus:border-primary focus-visible:shadow-none dark:border-gray-700 dark:text-white"
          />
        </div>

        <div className="mb-6">
          <label className="mb-2.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Password
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            placeholder="Enter your password"
            className="w-full rounded-lg border border-gray-300 bg-transparent py-3 px-4 text-gray-800 outline-none focus:border-primary focus-visible:shadow-none dark:border-gray-700 dark:text-white"
          />
        </div>

        <div className="mb-6">
          <label className="mb-2.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Confirm Password
          </label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            placeholder="Confirm your password"
            className={`w-full rounded-lg border ${
              !passwordMatch ? 'border-red-500' : 'border-gray-300'
            } bg-transparent py-3 px-4 text-gray-800 outline-none focus:border-primary focus-visible:shadow-none dark:border-gray-700 dark:text-white`}
          />
          {!passwordMatch && (
            <p className="mt-1 text-sm text-red-500">Passwords do not match</p>
          )}
        </div>

        <div className="mb-6">
          <button
            type="submit"
            disabled={loading || !passwordMatch}
            className="flex w-full items-center justify-center rounded-lg bg-primary py-3 px-9 text-center font-medium text-white hover:bg-primary/90 disabled:bg-primary/70"
          >
            {loading ? 'Signing up...' : 'Sign Up'}
          </button>
        </div>
      </form>

      <p className="text-center text-sm font-medium text-gray-600 dark:text-gray-400">
        Already have an account?{' '}
        <Link
          href="/auth/signin"
          className="text-primary hover:underline"
        >
          Sign In
        </Link>
      </p>
    </div>
  );
};

export default SignUpForm; 