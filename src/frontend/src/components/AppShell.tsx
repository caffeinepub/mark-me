import { Button } from "@/components/ui/button";
import {
  CheckSquare,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Sun,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { cn } from "../lib/utils";
import AddWorkerPage from "../pages/AddWorkerPage";
import AttendancePage from "../pages/AttendancePage";
import DashboardPage from "../pages/DashboardPage";
import MarkingPage from "../pages/MarkingPage";

type Page = "dashboard" | "attendance" | "marking" | "add-worker";

interface NavItem {
  id: Page;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "attendance", label: "Attendance Register", icon: ClipboardCheck },
  { id: "marking", label: "Marking Section", icon: CheckSquare },
  { id: "add-worker", label: "Add Worker", icon: UserPlus },
];

interface AppShellProps {
  darkMode: boolean;
  onToggleDark: () => void;
}

export default function AppShell({ darkMode, onToggleDark }: AppShellProps) {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { clear } = useInternetIdentity();

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <DashboardPage onNavigate={setCurrentPage} />;
      case "attendance":
        return <AttendancePage />;
      case "marking":
        return <MarkingPage />;
      case "add-worker":
        return <AddWorkerPage />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 bg-sidebar border-r border-sidebar-border">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-sidebar-border">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sidebar-primary">
            <CheckSquare className="w-4 h-4 text-sidebar-primary-foreground" />
          </div>
          <span className="text-sidebar-foreground font-bold text-lg tracking-tight">
            Mark Me
          </span>
        </div>

        {/* Nav */}
        <nav
          className="flex-1 px-3 py-4 space-y-1"
          aria-label="Main navigation"
        >
          {navItems.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              data-ocid={`nav.${item.id}.link`}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                currentPage === item.id
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Bottom controls */}
        <div className="px-3 py-4 border-t border-sidebar-border space-y-1">
          <button
            type="button"
            onClick={onToggleDark}
            data-ocid="settings.toggle"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all"
          >
            {darkMode ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
          <button
            type="button"
            onClick={() => clear()}
            data-ocid="auth.close_button"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-sidebar border-b border-sidebar-border shrink-0">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-sidebar-primary" />
            <span className="text-sidebar-foreground font-bold text-base">
              Mark Me
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(true)}
            data-ocid="nav.open_modal_button"
            className="text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Mobile Bottom Nav */}
        <nav
          className="md:hidden flex border-t border-border bg-card shrink-0"
          aria-label="Bottom navigation"
        >
          {navItems.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              data-ocid={`nav.${item.id}.link`}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-2.5 px-1 text-xs font-medium transition-colors",
                currentPage === item.id
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="leading-none truncate max-w-full px-1">
                {item.id === "add-worker" ? "Add" : item.label.split(" ")[0]}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Mobile slide-over menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              data-ocid="nav.sheet"
              className="fixed inset-y-0 left-0 z-50 w-64 bg-sidebar flex flex-col md:hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-sidebar-border">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-sidebar-primary" />
                  <span className="text-sidebar-foreground font-bold">
                    Mark Me
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  data-ocid="nav.close_button"
                  className="text-sidebar-foreground/70 hover:text-sidebar-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 px-3 py-4 space-y-1">
                {navItems.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => {
                      setCurrentPage(item.id);
                      setMobileMenuOpen(false);
                    }}
                    data-ocid={`nav.${item.id}.link`}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                      currentPage === item.id
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </button>
                ))}
              </nav>
              <div className="px-3 py-4 border-t border-sidebar-border space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    onToggleDark();
                    setMobileMenuOpen(false);
                  }}
                  data-ocid="settings.toggle"
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all"
                >
                  {darkMode ? (
                    <Sun className="w-4 h-4" />
                  ) : (
                    <Moon className="w-4 h-4" />
                  )}
                  {darkMode ? "Light Mode" : "Dark Mode"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clear();
                    setMobileMenuOpen(false);
                  }}
                  data-ocid="auth.close_button"
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
