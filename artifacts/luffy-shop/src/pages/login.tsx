import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { playLoginSound } from "@/lib/sound";
import { Loader2, Lock, Mail } from "lucide-react";

function ShopLogo() {
  return (
    <svg width="36" height="36" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="lg-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="white" stopOpacity="1"/>
          <stop offset="60%" stopColor="hsl(271,85%,78%)" stopOpacity="0.9"/>
          <stop offset="100%" stopColor="hsl(215,85%,65%)" stopOpacity="0.5"/>
        </radialGradient>
        <linearGradient id="lg-arm" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(271,85%,70%)" stopOpacity="0.9"/>
          <stop offset="50%" stopColor="hsl(215,85%,65%)" stopOpacity="0.7"/>
          <stop offset="100%" stopColor="hsl(315,75%,65%)" stopOpacity="0.4"/>
        </linearGradient>
        <filter id="lg-glow">
          <feGaussianBlur stdDeviation="1.5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <path d="M16 16 Q26 6 27 16 Q26 26 16 27 Q6 26 5 16 Q6 6 16 5" stroke="url(#lg-arm)" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.75"/>
      <path d="M16 16 Q21 11 22 16 Q21 21 16 22 Q11 21 10 16 Q11 11 16 10" stroke="url(#lg-arm)" strokeWidth="1.1" fill="none" strokeLinecap="round" opacity="0.55"/>
      <circle cx="16" cy="16" r="4.5" fill="url(#lg-core)" filter="url(#lg-glow)" opacity="0.9"/>
      <circle cx="16" cy="16" r="2" fill="white" opacity="0.95"/>
      <circle cx="4" cy="5" r="1.1" fill="white" opacity="0.9"/>
      <circle cx="28" cy="4" r="0.8" fill="hsl(271,85%,85%)" opacity="0.8"/>
      <circle cx="29" cy="25" r="0.9" fill="white" opacity="0.7"/>
      <circle cx="3" cy="27" r="0.7" fill="hsl(215,85%,80%)" opacity="0.8"/>
    </svg>
  );
}

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password required"),
});
type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { setUser } = useAuth();
  const { toast } = useToast();
  const loginMutation = useLogin();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate({ data }, {
      onSuccess: (res) => {
        const user = res.user as {
          id: number; userId: string; email: string; username: string;
          balance: number; isAdmin: boolean; isBanned: boolean; lastLoginAt: string | null; createdAt: string;
        };
        playLoginSound();
        setUser(user);
        setLocation(user.isAdmin ? "/admin" : "/dashboard");
      },
      onError: (err) => {
        const msg = (err as { data?: { error?: string } })?.data?.error ?? "Invalid email or password.";
        toast({ title: "Login failed", description: msg, variant: "destructive" });
      },
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: "hsl(262,45%,3%)" }}>

      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(236,72,153,0.08) 0%, transparent 70%)", filter: "blur(50px)" }} />
        {[...Array(20)].map((_, i) => (
          <div key={i} className="absolute rounded-full animate-twinkle"
            style={{
              width: `${Math.random() * 2 + 1}px`, height: `${Math.random() * 2 + 1}px`,
              background: "white", opacity: Math.random() * 0.5 + 0.2,
              top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
            }} />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-sm px-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-5 mx-auto relative"
            style={{
              background: "linear-gradient(135deg, rgba(139,92,246,0.18) 0%, rgba(59,130,246,0.14) 100%)",
              border: "1px solid rgba(139,92,246,0.35)",
              boxShadow: "0 0 30px rgba(139,92,246,0.25), inset 0 0 20px rgba(139,92,246,0.05)",
            }}>
            <ShopLogo />
          </div>
          <h1 className="text-3xl font-black tracking-tight"
            style={{ background: "linear-gradient(135deg, hsl(271,85%,72%) 0%, hsl(215,85%,65%) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            COZY XO
          </h1>
          <div className="text-sm font-bold mt-0.5" style={{ color: "hsl(271,60%,70%)" }}>.SHOP</div>
          <p className="text-sm text-muted-foreground mt-3">Sign in to your account to continue</p>
        </div>

        <div className="rounded-2xl p-6"
          style={{
            background: "hsl(262,38%,6%)",
            border: "1px solid rgba(139,92,246,0.2)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.7), 0 0 40px rgba(139,92,246,0.06)",
          }}>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={13} />
                      <Input {...field} type="email" placeholder="your@email.com"
                        className="pl-9 h-11 text-sm rounded-xl"
                        style={{ background: "rgba(139,92,246,0.06)", borderColor: "rgba(139,92,246,0.2)" }}
                        data-testid="input-email" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={13} />
                      <Input {...field} type="password" placeholder="••••••••"
                        className="pl-9 h-11 text-sm rounded-xl"
                        style={{ background: "rgba(139,92,246,0.06)", borderColor: "rgba(139,92,246,0.2)" }}
                        data-testid="input-password" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit"
                className="w-full h-11 font-black tracking-widest rounded-xl text-white shadow-lg mt-1"
                style={{
                  background: "linear-gradient(135deg, hsl(271,85%,58%) 0%, hsl(215,85%,52%) 100%)",
                  boxShadow: "0 0 24px rgba(139,92,246,0.4)",
                }}
                disabled={loginMutation.isPending} data-testid="button-login">
                {loginMutation.isPending
                  ? <><Loader2 size={14} className="animate-spin mr-2" />Signing in...</>
                  : "SIGN IN"}
              </Button>
            </form>
          </Form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-5">
          No account?{" "}
          <Link href="/register" className="font-bold transition-colors" style={{ color: "hsl(271,75%,72%)" }} data-testid="link-register">
            Register here
          </Link>
        </p>

        <div className="text-center mt-8">
          <p className="text-xs" style={{ color: "hsl(265,15%,35%)" }}>
            Developed by{" "}
            <a href="https://t.me/cozybalenciaga" target="_blank" rel="noopener noreferrer" className="hover:text-violet-400 transition-colors">
              @cozybalenciaga
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
