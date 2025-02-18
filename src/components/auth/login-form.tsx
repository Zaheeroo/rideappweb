"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: LoginFormValues | SignupFormValues) {
    setIsLoading(true);
    try {
      // TODO: Implement actual login/signup logic here
      console.log(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

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
        </div>

        {isSignup && (
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

        <Button 
          type="submit" 
          className="w-full bg-white text-blue-600 hover:bg-gray-100"
          disabled={isLoading}
        >
          {isLoading 
            ? (isSignup ? "Creating Account..." : "Signing in...") 
            : (isSignup ? "Create Account" : "Sign in")
          }
        </Button>
        
        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignup(!isSignup);
              loginForm.reset();
              signupForm.reset();
            }}
            className="text-sm text-gray-200 hover:text-white"
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