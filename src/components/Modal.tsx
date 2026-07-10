"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

//  ── 类型 ──
interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

interface AlertOptions {
  title?: string;
  message: string;
  confirmText?: string;
}

interface ModalContextType {
  alert: (options: AlertOptions) => Promise<void>;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ModalContext = createContext<ModalContextType | null>(null);

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal 必须在 ModalProvider 内使用");
  return ctx;
}

//  ── Provider ──
export function ModalProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [opts, setOpts] = useState<ConfirmOptions | AlertOptions | null>(null);
  const [resolveRef, setResolveRef] = useState<((v: boolean | void) => void) | null>(null);

  const alert = useCallback((options: AlertOptions) => {
    setOpts(options);
    setVisible(true);
    return new Promise<void>((resolve) => {
      setResolveRef(() => () => {
        setVisible(false);
        resolve();
      });
    });
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    setOpts(options);
    setVisible(true);
    return new Promise<boolean>((resolve) => {
      setResolveRef(() => (v: boolean) => {
        setVisible(false);
        resolve(v);
      });
    });
  }, []);

  const isConfirm = "cancelText" in (opts || {});

  const handleConfirm = () => {
    setVisible(false);
    resolveRef?.(true);
  };

  const handleCancel = () => {
    setVisible(false);
    resolveRef?.(false);
  };

  const handleClose = () => {
    setVisible(false);
    if (isConfirm) {
      resolveRef?.(false);
    } else {
      resolveRef?.();
    }
  };

  return (
    <ModalContext.Provider value={{ alert, confirm }}>
      {children}

      {visible && opts && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000 }} onClick={handleClose}>
          {/* 遮罩 */}
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.2)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }} />
          {/* 弹窗 */}
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "90%", maxWidth: 380 }}>
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "rgba(255,255,255,0.85)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                border: "1px solid rgba(255,255,255,0.6)",
                borderRadius: 20,
                padding: "32px 28px 24px",
                boxShadow: "0 20px 60px rgba(0,0,0,0.1)",
              }}
            >
              {opts.title && (
                <h3 style={{ fontSize: 17, fontWeight: 600, margin: "0 0 10px", color: "var(--fg)" }}>
                  {opts.title}
                </h3>
              )}
              <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--fg-dim)", margin: "0 0 28px" }}>
                {opts.message}
              </p>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                {isConfirm && (
                  <button
                    onClick={handleCancel}
                    style={{
                      padding: "9px 24px",
                      border: "1px solid rgba(0,0,0,0.08)",
                      background: "rgba(255,255,255,0.6)",
                      fontFamily: "inherit",
                      fontSize: 14,
                      color: "var(--fg-dim)",
                      cursor: "pointer",
                      borderRadius: 10,
                      transition: "all 0.2s",
                    }}
                  >
                    {(opts as ConfirmOptions).cancelText || "取消"}
                  </button>
                )}
                <button
                  onClick={handleConfirm}
                  style={{
                    padding: "9px 24px",
                    border: "none",
                    background: (opts as ConfirmOptions).danger ? "#ba5252" : "var(--fg)",
                    fontFamily: "inherit",
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#fff",
                    cursor: "pointer",
                    borderRadius: 10,
                    transition: "all 0.2s",
                  }}
                >
                  {(opts as ConfirmOptions).confirmText || (opts as AlertOptions).confirmText || "确定"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
}
