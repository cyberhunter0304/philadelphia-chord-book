import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { LogIn, LogOut, Moon, Music4, Search, Shield, Sun } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CommandPalette } from "@/components/CommandPalette";
import { cn } from "@/lib/utils";

function navClass({ isActive }) {
  return cn(
    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
    isActive ? "bg-surface-muted text-foreground" : "text-muted-foreground hover:text-foreground"
  );
}

export function AppShell() {
  const { user, role, isAdmin, isEditor, signIn, signOut, configured } = useAuth();
  const { theme, cycle } = useTheme();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <Music4 className="h-5 w-5 text-primary" />
            <span className="hidden sm:inline">Philadelphia Chord Book</span>
          </Link>

          <nav className="ml-4 hidden items-center gap-1 md:flex">
            <NavLink to="/" end className={navClass}>
              Library
            </NavLink>
            {user && (
              <NavLink to="/setlists" className={navClass}>
                Setlists
              </NavLink>
            )}
            {isAdmin && (
              <NavLink to="/admin" className={navClass}>
                Admin
              </NavLink>
            )}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground"
              onClick={() => setPaletteOpen(true)}
            >
              <Search className="h-4 w-4" />
              <span className="hidden lg:inline">Search</span>
              <kbd className="hidden rounded border px-1.5 text-[10px] lg:inline">⌘K</kbd>
            </Button>

            <Button variant="ghost" size="icon" onClick={cycle} aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="ml-1 h-8 w-8 overflow-hidden rounded-full border">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="grid h-full w-full place-items-center text-xs">
                        {(user.displayName || user.email || "?")[0].toUpperCase()}
                      </span>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>
                    {user.displayName || user.email}
                    <span className="ml-1 rounded bg-surface-muted px-1 capitalize">{role}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {isEditor && (
                    <DropdownMenuItem onClick={() => navigate("/setlists")}>
                      My setlists
                    </DropdownMenuItem>
                  )}
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate("/admin")}>
                      <Shield className="h-4 w-4" /> Admin
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button size="sm" onClick={signIn} className="gap-2" disabled={!configured}>
                <LogIn className="h-4 w-4" /> Sign in
              </Button>
            )}
          </div>
        </div>
      </header>

      {!configured && (
        <div className="border-b bg-accent/10 px-4 py-2 text-center text-xs text-accent">
          Preview mode — Firebase isn’t configured yet. Add <code>.env.local</code> from{" "}
          <code>.env.example</code> (see README) to enable sign-in, data, and AI.
        </div>
      )}

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
