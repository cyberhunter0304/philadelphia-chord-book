import { auth } from "./firebase";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = "GET", body, auth: needsAuth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (needsAuth && auth.currentUser) {
    headers.Authorization = `Bearer ${await auth.currentUser.getIdToken()}`;
  }
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, data.detail || data.message || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  base: BASE,
  health: () => request("/health", { auth: false }),
  me: () => request("/me"),

  // songs / folders
  listSongs: () => request("/songs", { auth: false }),
  getSong: (id) => request(`/songs/${id}`, { auth: false }),
  createSong: (song) => request("/songs", { method: "POST", body: song }),
  updateSong: (id, patch) => request(`/songs/${id}`, { method: "PATCH", body: patch }),
  deleteSong: (id) => request(`/songs/${id}`, { method: "DELETE" }),
  createFolder: (name) => request("/folders", { method: "POST", body: { name } }),
  renameFolder: (id, name) => request(`/folders/${id}`, { method: "PATCH", body: { name } }),
  deleteFolder: (id, cascade) => request(`/folders/${id}?cascade=${cascade ? "true" : "false"}`, { method: "DELETE" }),

  // setlists
  listSetlists: () => request("/setlists"),
  getSetlist: (id) => request(`/setlists/${id}`),
  createSetlist: (sl) => request("/setlists", { method: "POST", body: sl }),
  updateSetlist: (id, sl) => request(`/setlists/${id}`, { method: "PUT", body: sl }),
  deleteSetlist: (id) => request(`/setlists/${id}`, { method: "DELETE" }),

  // ai
  aiUsage: () => request("/ai/usage"),
  aiGenerateChords: (body) => request("/ai/generate-chords", { method: "POST", body }),
  aiSetlist: (body) => request("/ai/setlist", { method: "POST", body }),
  aiAssistant: (body) => request("/ai/assistant", { method: "POST", body }),
  aiSearch: (body) => request("/ai/search", { method: "POST", body }),
  aiCleanup: (body) => request("/ai/cleanup", { method: "POST", body }),

  // admin
  listUsers: () => request("/admin/users"),
  setUserRole: (uid, role) => request(`/admin/users/${uid}/role`, { method: "PUT", body: { role } }),

  // attachments
  listAttachments: (songId) => request(`/attachments/${songId}`, { auth: false }),
  attachmentUploadUrl: (songId, body) =>
    request(`/attachments/${songId}/upload-url`, { method: "POST", body }),
  deleteAttachment: (songId, filename) =>
    request(`/attachments/${songId}/${encodeURIComponent(filename)}`, { method: "DELETE" }),
};
