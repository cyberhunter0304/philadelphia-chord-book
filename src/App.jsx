import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { RequireRole } from "@/auth/RequireRole";
import { Library } from "@/pages/Library";
import { SongViewer } from "@/pages/SongViewer";
import { SongEditorPage } from "@/pages/SongEditorPage";
import { Present } from "@/pages/Present";
import { Setlists } from "@/pages/Setlists";
import { SetlistEditor } from "@/pages/SetlistEditor";
import { Admin } from "@/pages/Admin";
import { Login } from "@/pages/Login";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Fullscreen presentation — no shell */}
        <Route path="/present/song/:id" element={<Present mode="song" />} />
        <Route path="/present/setlist/:id" element={<Present mode="setlist" />} />
        <Route path="/login" element={<Login />} />

        <Route element={<AppShell />}>
          <Route index element={<Library />} />
          <Route path="songs/:id" element={<SongViewer />} />
          <Route
            path="songs/:id/edit"
            element={
              <RequireRole roles={["user", "admin"]}>
                <SongEditorPage />
              </RequireRole>
            }
          />
          <Route
            path="songs/new"
            element={
              <RequireRole roles={["user", "admin"]}>
                <SongEditorPage isNew />
              </RequireRole>
            }
          />
          <Route
            path="setlists"
            element={
              <RequireRole>
                <Setlists />
              </RequireRole>
            }
          />
          <Route
            path="setlists/:id"
            element={
              <RequireRole>
                <SetlistEditor />
              </RequireRole>
            }
          />
          <Route
            path="admin"
            element={
              <RequireRole roles={["admin"]}>
                <Admin />
              </RequireRole>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
