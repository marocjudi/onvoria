import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { Wrench, Check, FileText, User, Bell, DollarSign } from "lucide-react";

const loginSchema = insertUserSchema.pick({
  username: true,
  password: true,
});

const registerSchema = insertUserSchema;

export default function AuthPage() {
  const { user, loginMutation, registerMutation, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  // Login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Handle login submission
  const onLoginSubmit = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(data);
  };

  // Handle register submission
  const onRegisterSubmit = (data: z.infer<typeof registerSchema>) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex flex-col sm:flex-row bg-neutral-50">
      {/* Left column - Auth forms */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Wrench className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-neutral-900">Onvaria</h2>
            <p className="mt-2 text-sm text-neutral-600">
              Repair Management Platform
            </p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Login to your account</CardTitle>
                  <CardDescription>
                    Enter your credentials to access your account
                  </CardDescription>
                </CardHeader>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-username">Username</Label>
                      <Input
                        id="login-username"
                        type="text"
                        placeholder="Enter your username"
                        {...loginForm.register("username")}
                      />
                      {loginForm.formState.errors.username && (
                        <p className="text-sm text-red-500">
                          {loginForm.formState.errors.username.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="Enter your password"
                        {...loginForm.register("password")}
                      />
                      {loginForm.formState.errors.password && (
                        <p className="text-sm text-red-500">
                          {loginForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loginMutation.isPending || isLoading}
                    >
                      {loginMutation.isPending ? "Logging in..." : "Login"}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Create a new account</CardTitle>
                  <CardDescription>
                    Register to start managing your repair business
                  </CardDescription>
                </CardHeader>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-username">Username</Label>
                      <Input
                        id="register-username"
                        type="text"
                        placeholder="Choose a username"
                        {...registerForm.register("username")}
                      />
                      {registerForm.formState.errors.username && (
                        <p className="text-sm text-red-500">
                          {registerForm.formState.errors.username.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Password</Label>
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="Choose a password"
                        {...registerForm.register("password")}
                      />
                      {registerForm.formState.errors.password && (
                        <p className="text-sm text-red-500">
                          {registerForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={registerMutation.isPending || isLoading}
                    >
                      {registerMutation.isPending ? "Registering..." : "Register"}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right column - Hero section */}
      <div className="flex-1 bg-primary p-8 flex flex-col justify-center text-white hidden sm:block">
        <div className="max-w-md mx-auto">
          <h1 className="text-4xl font-bold mb-6">
            Modern Repair Management
          </h1>
          <p className="text-lg mb-8">
            Onvaria streamlines your repair business with comprehensive ticket
            management, invoicing, payment processing, and client communications.
          </p>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-white/20 p-2 rounded-full mr-4">
                <Check className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium">Ticket Tracking</h3>
                <p className="text-sm opacity-80">
                  Manage your repair tickets from receipt to completion
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-white/20 p-2 rounded-full mr-4">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium">Invoice Generation</h3>
                <p className="text-sm opacity-80">
                  Create professional invoices and quotes for your clients
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-white/20 p-2 rounded-full mr-4">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium">Payment Processing</h3>
                <p className="text-sm opacity-80">
                  Accept payments online or in-shop with ease
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-white/20 p-2 rounded-full mr-4">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium">Client Notifications</h3>
                <p className="text-sm opacity-80">
                  Keep your clients informed at every step of the repair process
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
