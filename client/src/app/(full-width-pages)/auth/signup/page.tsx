import SignUpForm from "@/components/auth/SignUpForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up | Company Management System",
  description: "Register for a new account in the Company Management System",
};

export default function SignUp() {
  return <SignUpForm />;
} 