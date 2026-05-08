import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { playLoginSound } from "@/lib/sound";
import { Loader2, Lock, Mail, User } from "lucide-react";

const registerSchema = z.object({
  username: z.string().min(2, "Username must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const { setUser } = useAuth();
  const { toast } = useToast();
  const registerMutation = useRegister();

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", email: "", password: "" },
  });

  const onSubmit = (data: RegisterForm) => {
    registerMutation.mutate({ data }, {
      onSuccess: (res) => {
        const user = res.user as {
          id: number; userId: string; email: string; username: string;
          balance: number; isAdmin: boolean; isBanned: boolean; lastLoginAt: string | null; createdAt: string;
        };
        playLoginSound();
        setUser(user);
        setLocation("/dashboard");
        toast({ title: "Welcome to COZY XO.SHOP!", description: `Your ID: ${user.userId}` });
      },
      onError: () => {
        toast({ title: "Registration failed", description: "Email may already be in use.", variant: "destructive" });
      },
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: "hsl(262,45%,3%)" }}>

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div className="absolute bottom-1/3 left-1/3 w-[350px] h-[350px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%)", filter: "blur(55px)" }} />
        {[...Array(18)].map((_, i) => (
          <div key={i} className="absolute rounded-full animate-twinkle"
            style={{
              width: `${Math.random() * 2 + 1}px`, height: `${Math.random() * 2 + 1}px`,
              background: "white", opacity: Math.random() * 0.5 + 0.15,
              top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
            }} />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-sm px-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 mx-auto"
            style={{
              background: "linear-gradient(135deg, rgba(59,130,246,0.20) 0%, rgba(139,92,246,0.18) 100%)",
              border: "1px solid rgba(59,130,246,0.35)",
              boxShadow: "0 0 26px rgba(59,130,246,0.22)",
            }}>
            <User size={26} style={{ color: "hsl(215,85%,68%)" }} />
          </div>
          <h1 className="text-2xl font-black tracking-tight"
            style={{ background: "linear-gradient(135deg, hsl(271,85%,72%) 0%, hsl(215,85%,65%) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            CREATE ACCOUNT
          </h1>
          <p className="text-sm text-muted-foreground mt-2">Join COZY XO.SHOP</p>
        </div>

        <div className="rounded-2xl p-6"
          style={{
            background: "hsl(262,38%,6%)",
            border: "1px solid rgba(59,130,246,0.2)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.7), 0 0 40px rgba(59,130,246,0.05)",
          }}>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="username" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Username</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={13} />
                      <Input {...field} placeholder="your_username"
                        className="pl-9 h-11 text-sm rounded-xl"
                        style={{ background: "rgba(59,130,246,0.06)", borderColor: "rgba(59,130,246,0.2)" }}
                        data-testid="input-username" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={13} />
                      <Input {...field} type="email" placeholder="your@email.com"
                        className="pl-9 h-11 text-sm rounded-xl"
                        style={{ background: "rgba(59,130,246,0.06)", borderColor: "rgba(59,130,246,0.2)" }}
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
                      <Input {...field} type="password" placeholder="min. 6 characters"
                        className="pl-9 h-11 text-sm rounded-xl"
                        style={{ background: "rgba(59,130,246,0.06)", borderColor: "rgba(59,130,246,0.2)" }}
                        data-testid="input-password" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit"
                className="w-full h-11 font-black tracking-widest rounded-xl text-white shadow-lg mt-1"
                style={{
                  background: "linear-gradient(135deg, hsl(215,85%,52%) 0%, hsl(271,85%,58%) 100%)",
                  boxShadow: "0 0 24px rgba(59,130,246,0.35)",
                }}
                disabled={registerMutation.isPending} data-testid="button-register">
                {registerMutation.isPending
                  ? <><Loader2 size={14} className="animate-spin mr-2" />Creating...</>
                  : "CREATE ACCOUNT"}
              </Button>
            </form>
          </Form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-5">
          Already have an account?{" "}
          <Link href="/" className="font-bold transition-colors" style={{ color: "hsl(271,75%,72%)" }} data-testid="link-login">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
