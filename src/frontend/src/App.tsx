import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import AppShell from "./components/AppShell";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useSaveUserSettings, useUserSettings } from "./hooks/useQueries";
import AuthPage from "./pages/AuthPage";

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const [darkMode, setDarkMode] = useState(false);
  const { data: settings } = useUserSettings();
  const saveSettings = useSaveUserSettings();

  // Apply dark mode from settings
  useEffect(() => {
    if (settings) {
      setDarkMode(settings.darkMode);
    }
  }, [settings]);

  // Apply dark class to html
  useEffect(() => {
    const html = document.documentElement;
    if (darkMode) {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
  }, [darkMode]);

  const handleToggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    saveSettings.mutate(next);
  };

  if (isInitializing) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading Mark Me...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      {!identity ? (
        <AuthPage />
      ) : (
        <AppShell darkMode={darkMode} onToggleDark={handleToggleDark} />
      )}
    </>
  );
}
