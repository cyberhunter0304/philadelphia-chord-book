import { Component } from "react";

export class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("App crashed:", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ maxWidth: 640, margin: "10vh auto", padding: 24, fontFamily: "sans-serif" }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Something broke while loading the app</h1>
        <p style={{ color: "#64748b", marginTop: 8 }}>
          This is usually missing Firebase config. Copy <code>.env.example</code> to{" "}
          <code>.env.local</code>, fill in the <code>VITE_FIREBASE_*</code> values, and restart{" "}
          <code>npm run dev</code>. See the README.
        </p>
        <pre
          style={{
            marginTop: 16,
            padding: 12,
            background: "#f1f5f9",
            borderRadius: 8,
            fontSize: 12,
            whiteSpace: "pre-wrap",
            overflow: "auto",
          }}
        >
          {String(this.state.error?.stack || this.state.error)}
        </pre>
        <button
          onClick={() => this.setState({ error: null })}
          style={{ marginTop: 12, padding: "6px 14px", borderRadius: 8, border: "1px solid #cbd5e1" }}
        >
          Retry
        </button>
      </div>
    );
  }
}
