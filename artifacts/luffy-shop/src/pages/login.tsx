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
import { CoinIcon } from "@/components/CoinIcon";
import { playLoginSound } from "@/lib/sound";
import { Loader2, Lock, Mail } from "lucide-react";

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
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden" style={{ background: "hsl(222,18%,4%)" }}>
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, hsl(0,85%,50%) 0%, transparent 70%)", filter: "blur(80px)" }} />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, hsl(215,85%,55%) 0%, transparent 70%)", filter: "blur(80px)" }} />
      </div>

      <div className="relative z-10 w-full max-w-sm px-6">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 mx-auto"
            style={{ background: "linear-gradient(135deg, rgba(220,38,38,0.15) 0%, rgba(59,130,246,0.12) 100%)", border: "1px solid rgba(220,38,38,0.3)", boxShadow: "0 0 24px rgba(220,38,38,0.2)" }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L15 9H22L16.5 13.5L18.5 21L12 16.5L5.5 21L7.5 13.5L2 9H9L12 2Z"
                style={{ fill: "hsl(0,85%,55%)" }} />
            </svg>
          </div>
          <h1 className="text-2xl font-black tracking-tight">
            LUFFY XO<span className="text-primary">.SHOP</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Enter your credentials to continue</p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl p-6"
          style={{ background: "hsl(220,16%,7%)", border: "1px solid hsl(218,20%,13%)", boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={13} />
                        <Input
                          {...field}
                          type="email"
                          placeholder="your@email.com"
                          className="pl-9 h-10 text-sm rounded-xl"
                          style={{ background: "hsl(218,22%,11%)", borderColor: "hsl(218,22%,16%)" }}
                          data-testid="input-email"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={13} />
                        <Input
                          {...field}
                          type="password"
                          placeholder="••••••••"
                          className="pl-9 h-10 text-sm rounded-xl"
                          style={{ background: "hsl(218,22%,11%)", borderColor: "hsl(218,22%,16%)" }}
                          data-testid="input-password"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full h-11 font-black tracking-widest rounded-xl text-white shadow-lg transition-all"
                style={{ background: "linear-gradient(135deg, hsl(0,85%,48%) 0%, hsl(0,85%,38%) 100%)", boxShadow: "0 0 20px rgba(220,38,38,0.35)" }}
                disabled={loginMutation.isPending}
                data-testid="button-login"
              >
                {loginMutation.isPending ? (
                  <><Loader2 size={14} className="animate-spin mr-2" />Logging in...</>
                ) : "LOGIN"}
              </Button>
            </form>
          </Form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-5">
          No account?{" "}
          <Link href="/register" className="font-bold transition-colors" style={{ color: "hsl(215,85%,62%)" }} data-testid="link-register">
            Register here
          </Link>
        </p>

        <div className="text-center mt-8">
          <p className="text-xs text-muted-foreground/35">
            @web is designed by t.me/cozybalenciaga &nbsp;|&nbsp; @cozy x luffy web generator
          </p>
        </div>
      </div>
    </div>
  );
}
