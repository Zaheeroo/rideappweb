"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button as MovingButton } from "@/components/ui/moving-border";
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
  const [showEmailLogin, setShowEmailLogin] = useState(false);
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
        // Handle signup - always set role to customer
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
    <div className="bg-black/40 backdrop-blur-lg rounded-lg p-6 shadow-xl border border-white/10">
      <form onSubmit={
        isSignup 
          ? signupForm.handleSubmit(onSubmit)
          : loginForm.handleSubmit(onSubmit)
      } className="space-y-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white">
            {isSignup ? "Create Account" : "Welcome Back"}
          </h2>
          {error && (
            <p className="mt-2 text-sm text-red-400">
              {error}
            </p>
          )}
          {successMessage && (
            <p className="mt-2 text-sm text-green-400">
              {successMessage}
            </p>
          )}
        </div>

        {!isSignup && (
          <div className="space-y-2">
            <Label htmlFor="role" className="text-white">Login as</Label>
            <select
              id="role"
              {...loginForm.register("role")}
              className="w-full px-3 py-2 bg-white/20 border border-white/20 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={UserRole.CUSTOMER} className="bg-gray-800">Customer (Tourist)</option>
              <option value={UserRole.DRIVER} className="bg-gray-800">Driver</option>
              <option value={UserRole.ADMINISTRATOR} className="bg-gray-800">Administrator</option>
            </select>
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-2 bg-gray-400 text-gray-800 p-2 rounded-md cursor-not-allowed opacity-70 mb-4"
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

        <button
          type="button"
          onClick={toggleEmailLogin}
          className="w-full text-center"
        >
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 text-white bg-black/40 hover:text-blue-400 cursor-pointer transition-colors">
                {showEmailLogin ? "Hide email login" : "Or continue with email"}
              </span>
            </div>
          </div>
        </button>

        {showEmailLogin && (
          <div className="space-y-4 pt-2">
            {isSignup && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    {...signupForm.register("name")}
                    className="bg-white/20 border-white/20 text-white placeholder:text-gray-300"
                  />
                  {signupForm.formState.errors.name && (
                    <p className="text-red-300 text-sm">{signupForm.formState.errors.name.message}</p>
                  )}
                </div>
              </>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...(isSignup ? signupForm.register("email") : loginForm.register("email"))}
                className="bg-white/20 border-white/20 text-white placeholder:text-gray-300"
              />
              {(isSignup ? signupForm.formState.errors.email : loginForm.formState.errors.email) && (
                <p className="text-red-300 text-sm">
                  {isSignup 
                    ? signupForm.formState.errors.email?.message
                    : loginForm.formState.errors.email?.message
                  }
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">Password</Label>
              <Input
                id="password"
                type="password"
                {...(isSignup ? signupForm.register("password") : loginForm.register("password"))}
                className="bg-white/20 border-white/20 text-white"
              />
              {(isSignup ? signupForm.formState.errors.password : loginForm.formState.errors.password) && (
                <p className="text-red-300 text-sm">
                  {isSignup 
                    ? signupForm.formState.errors.password?.message
                    : loginForm.formState.errors.password?.message
                  }
                </p>
              )}
            </div>

            {isSignup && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...signupForm.register("confirmPassword")}
                  className="bg-white/20 border-white/20 text-white"
                />
                {signupForm.formState.errors.confirmPassword && (
                  <p className="text-red-300 text-sm">{signupForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>
            )}

            <MovingButton
              type="submit"
              className="bg-white text-blue-600 hover:bg-gray-100 w-full text-lg font-medium"
              containerClassName="w-full"
              disabled={isLoading}
              duration={3000}
              borderClassName="h-5 w-5 opacity-[0.8] bg-[radial-gradient(var(--sky-500)_40%,transparent_60%)]"
            >
              {isLoading 
                ? (isSignup ? "Creating Account..." : "Signing in...") 
                : (isSignup ? "Create Account" : "Sign in")
              }
            </MovingButton>
          </div>
        )}

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => {
              setIsSignup(!isSignup);
              setShowEmailLogin(false);
              loginForm.reset();
              signupForm.reset();
            }}
            className="text-base text-gray-200 hover:text-white"
          >
            {isSignup 
              ? "Already have an account? Sign in" 
              : "Don't have an account? Sign up"
            }
          </button>
        </div>
      </form>
    </div>
  );
} 