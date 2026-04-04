import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckSquare, Loader2, Users } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useSaveCallerUserProfile } from "../hooks/useQueries";

export default function AuthPage() {
  const { login, loginStatus } = useInternetIdentity();
  const saveProfile = useSaveCallerUserProfile();
  const [registerName, setRegisterName] = useState("");
  const [registerError, setRegisterError] = useState("");
  const isLoggingIn = loginStatus === "logging-in";

  const handleLogin = () => {
    login();
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError("");
    if (!registerName.trim()) {
      setRegisterError("Please enter your name.");
      return;
    }
    try {
      await login();
      await saveProfile.mutateAsync(registerName.trim());
      toast.success("Account created! Welcome to Mark Me.");
    } catch {
      toast.error("Registration failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4 shadow-card-md">
            <CheckSquare className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Mark Me</h1>
          <p className="text-muted-foreground mt-1">
            Worker Attendance Management
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="shadow-card-md border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Welcome Back</CardTitle>
              <CardDescription>
                Sign in or create a new account to manage attendance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login">
                <TabsList className="grid grid-cols-2 w-full mb-6">
                  <TabsTrigger value="login" data-ocid="auth.tab">
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger value="register" data-ocid="auth.tab">
                    Register
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Use Internet Identity to sign in securely. Your data is
                      accessible from any device.
                    </p>
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleLogin}
                      disabled={isLoggingIn}
                      data-ocid="auth.primary_button"
                    >
                      {isLoggingIn ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                          Signing In...
                        </>
                      ) : (
                        <>
                          <Users className="mr-2 h-4 w-4" /> Sign In with
                          Identity
                        </>
                      )}
                    </Button>
                    {loginStatus === "loginError" && (
                      <p
                        className="text-sm text-destructive text-center"
                        data-ocid="auth.error_state"
                      >
                        Sign in failed. Please try again.
                      </p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-name">Your Name</Label>
                      <Input
                        id="register-name"
                        placeholder="e.g. John Smith"
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                        data-ocid="auth.input"
                      />
                      {registerError && (
                        <p
                          className="text-xs text-destructive"
                          data-ocid="auth.error_state"
                        >
                          {registerError}
                        </p>
                      )}
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      size="lg"
                      disabled={isLoggingIn || saveProfile.isPending}
                      data-ocid="auth.submit_button"
                    >
                      {isLoggingIn || saveProfile.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                          Creating Account...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}
