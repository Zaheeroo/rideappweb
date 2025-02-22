"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const UserRole = {
  CUSTOMER: "customer",
  DRIVER: "driver",
  ADMIN: "admin",
  ADMINISTRATOR: "Administrator",
} as const;

type UserRoleType = typeof UserRole[keyof typeof UserRole];

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum([UserRole.CUSTOMER, UserRole.DRIVER, UserRole.ADMIN, UserRole.ADMINISTRATOR]).default(UserRole.CUSTOMER),
});

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  role: z.enum([UserRole.CUSTOMER]).default(UserRole.CUSTOMER),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;

export function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [showEmailLogin, setShowEmailLogin] = useState(true);
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      role: UserRole.CUSTOMER,
    },
  });

  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: UserRole.CUSTOMER,
    },
  });

  async function onSubmit(data: LoginFormValues | SignupFormValues) {
    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      if (isSignup) {
        const signupData = data as SignupFormValues;
        const { data: authData, error: signupError } = await supabase.auth.signUp({
          email: signupData.email.toLowerCase().trim(),
          password: signupData.password,
          options: {
            data: {
              full_name: signupData.name.trim(),
              role: UserRole.CUSTOMER,
            },
          },
        });

        if (signupError) {
          setError(signupError.message);
          return;
        }

        if (!authData.user) {
          setError('Failed to create account');
          return;
        }

        setSuccessMessage(
          "Account created successfully! Please check your email to verify your account before signing in."
        );
        setIsSignup(false);
        loginForm.reset();
        return;
      }

      // Handle login
      const loginData = data as LoginFormValues;
      const result = await signIn('credentials', {
        email: loginData.email.toLowerCase().trim(),
        password: loginData.password,
        role: loginData.role === 'Administrator' ? UserRole.ADMIN : loginData.role,
        callbackUrl: `/?role=${loginData.role}`,
        redirect: false,
      });

      if (result?.error) {
        if (result.error.includes('Email not confirmed')) {
          setError('Please verify your email address before signing in. Check your inbox for the verification link.');
        } else {
          setError(result.error);
        }
        return;
      }

      setSuccessMessage("Login successful! Redirecting...");
      
      if (result?.url) {
        router.push(result.url);
        router.refresh();
      }

    } catch (error) {
      console.error('Auth error:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }

  const handleGoogleSignIn = async () => {
    alert("Google Sign-in will be available soon!");
  };

  const toggleEmailLogin = () => {
    setShowEmailLogin(!showEmailLogin);
    if (!showEmailLogin) {
      loginForm.reset();
      signupForm.reset();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-black/80 backdrop-blur-xl rounded-xl p-8 shadow-2xl border border-white/10">
        <form onSubmit={
          isSignup 
            ? signupForm.handleSubmit(onSubmit)
            : loginForm.handleSubmit(onSubmit)
        } className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">
              {isSignup ? "Create Account" : "Welcome Back"}
            </h2>
            {!isSignup && (
              <div className="mb-6">
                <Label htmlFor="role" className="sr-only">Login as</Label>
                <select
                  id="role"
                  {...loginForm.register("role")}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value={UserRole.ADMINISTRATOR} className="bg-gray-800">Administrator</option>
                  <option value={UserRole.CUSTOMER} className="bg-gray-800">Customer (Tourist)</option>
                  <option value={UserRole.DRIVER} className="bg-gray-800">Driver</option>
                </select>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-2 bg-white/10 text-white border border-white/10 p-3 rounded-lg hover:bg-white/20 transition-all cursor-not-allowed opacity-70"
            disabled
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google (Coming Soon)
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 text-white/60 bg-black">
                {showEmailLogin ? "Hide email login" : "Or continue with email"}
              </span>
            </div>
          </div>

          {showEmailLogin && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="email" className="sr-only">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Email"
                  {...(isSignup ? signupForm.register("email") : loginForm.register("email"))}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-white/10 rounded-lg text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
                {isSignup && signupForm.formState.errors.email && (
                  <p className="mt-1 text-sm text-red-400">{signupForm.formState.errors.email.message}</p>
                )}
                {!isSignup && loginForm.formState.errors.email && (
                  <p className="mt-1 text-sm text-red-400">{loginForm.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="password" className="sr-only">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Password"
                  {...(isSignup ? signupForm.register("password") : loginForm.register("password"))}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-white/10 rounded-lg text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
                {isSignup && signupForm.formState.errors.password && (
                  <p className="mt-1 text-sm text-red-400">{signupForm.formState.errors.password.message}</p>
                )}
                {!isSignup && loginForm.formState.errors.password && (
                  <p className="mt-1 text-sm text-red-400">{loginForm.formState.errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-white text-gray-900 font-medium py-2 px-4 rounded-lg hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Loading..." : (isSignup ? "Sign Up" : "Sign In")}
              </button>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-400 text-center mt-4">
              {error}
            </p>
          )}
          {successMessage && (
            <p className="text-sm text-green-400 text-center mt-4">
              {successMessage}
            </p>
          )}

          <p className="text-center text-sm text-white/60">
            {isSignup ? (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setIsSignup(false)}
                  className="text-blue-400 hover:text-blue-300 font-medium"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setIsSignup(true)}
                  className="text-blue-400 hover:text-blue-300 font-medium"
                >
                  Sign up
                </button>
              </>
            )}
          </p>
        </form>
      </div>
    </div>
  );
} 