import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Badge, Spinner } from "@/components/ui/misc";

export function Admin() {
  const { user } = useAuth();
  const [users, setUsers] = useState(null);
  const [error, setError] = useState(null);
  const [savingUid, setSavingUid] = useState(null);

  const load = () => api.listUsers().then(setUsers).catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);

  const setRole = async (uid, role) => {
    setSavingUid(uid);
    try {
      await api.setUserRole(uid, role);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSavingUid(null);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="flex items-center gap-2 text-xl font-semibold">
        <ShieldCheck className="h-5 w-5 text-primary" /> Admin
      </h1>
      <p className="text-sm text-muted-foreground">
        Members must sign in once before they appear here. Role changes take effect after they
        refresh their session.
      </p>

      {error && <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-500">{error}</p>}

      {!users ? (
        <div className="flex justify-center p-10">
          <Spinner className="h-6 w-6" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2">User</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">Last seen</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((u) => (
                <tr key={u.uid}>
                  <td className="px-4 py-2">
                    <p className="font-medium">{u.display_name || "—"}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </td>
                  <td className="px-4 py-2">
                    <Badge variant={u.role === "admin" ? "primary" : "default"}>{u.role}</Badge>
                  </td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">
                    {u.last_seen ? new Date(u.last_seen).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {u.uid === user.uid ? (
                      <span className="text-xs text-muted-foreground">you</span>
                    ) : savingUid === u.uid ? (
                      <Spinner />
                    ) : u.role === "admin" ? (
                      <Button size="sm" variant="ghost" onClick={() => setRole(u.uid, "user")}>
                        Make user
                      </Button>
                    ) : (
                      <Button size="sm" variant="secondary" onClick={() => setRole(u.uid, "admin")}>
                        Make admin
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
