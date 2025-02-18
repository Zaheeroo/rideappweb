import { WavyBackground } from "@/components/ui/wavy-background";
import { LoginForm } from "@/components/auth/login-form";

export default function Home() {
  return (
    <main className="min-h-screen">
      <WavyBackground 
        className="max-w-4xl mx-auto"
        colors={['#1a365d', '#2c5282', '#2b6cb0']}
        waveOpacity={0.2}
        blur={3}
      >
        <div className="w-full max-w-md mx-auto p-6 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-white">
              Jaco Rides
            </h1>
            <p className="text-gray-100">
              Your trusted transportation partner in Costa Rica
            </p>
          </div>
          
          <LoginForm />
        </div>
      </WavyBackground>
    </main>
  );
}
