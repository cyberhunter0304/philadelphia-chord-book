import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Music4 } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import { Button } from "@/components/ui/button";

export function Login() {
  const { user, signIn, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";

  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, from, navigate]);

  return (
    <div className="grid min-h-screen place-items-center p-4">
      <div className="w-full max-w-sm rounded-xl border bg-surface p-8 text-center shadow-sm">
        <Music4 className="mx-auto h-10 w-10 text-primary" />
        <h1 className="mt-4 text-xl font-semibold">Philadelphia Chord Book</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to edit songs, use AI tools, and build setlists. Browsing and presenting
          need no account.
        </p>
        <Button className="mt-6 w-full" onClick={signIn} disabled={loading}>
          Continue with Google
        </Button>
        <button
          onClick={() => navigate("/")}
          className="mt-3 text-xs text-muted-foreground hover:underline"
        >
          Just browsing → go to the library
        </button>
      </div>
    </div>
  );
}
