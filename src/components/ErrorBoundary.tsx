"use client";

import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div style={{ padding: "60px 24px", textAlign: "center", color: "var(--fg-dim)" }}>
          <h2 style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>出错了</h2>
          <p style={{ fontSize: 14, marginBottom: 24 }}>{this.state.error?.message || "页面遇到了意外错误"}</p>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: "8px 24px", border: "1px solid rgba(255,255,255,0.4)", borderRadius: 10, background: "var(--fg)", color: "#fff", fontFamily: "inherit", fontSize: 14, cursor: "pointer" }}
          >
            刷新页面
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}