import { afterEach, expect, test } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "./App.jsx";
import { AuthProvider } from "./auth/AuthProvider.jsx";
import { ThemeProvider } from "./lib/theme.jsx";
import { ErrorBoundary } from "./components/ErrorBoundary.jsx";

let container;

afterEach(() => {
  container?.remove();
  container = null;
});

test("app mounts without crashing and renders the shell", async () => {
  container = document.createElement("div");
  document.body.appendChild(container);
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  await act(async () => {
    createRoot(container).render(
      <ErrorBoundary>
        <ThemeProvider>
          <QueryClientProvider client={qc}>
            <AuthProvider>
              <App />
            </AuthProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </ErrorBoundary>
    );
  });

  const html = container.innerHTML;
  expect(html).not.toMatch(/Something broke while loading/);
  expect(html).toMatch(/Philadelphia Chord Book|Library/);
});
