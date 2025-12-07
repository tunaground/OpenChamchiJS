"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import styled, { keyframes } from "styled-components";

// Animation
const slideIn = keyframes`
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const slideOut = keyframes`
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(100%);
    opacity: 0;
  }
`;

// Styled Components
const ToastContainer = styled.div`
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  pointer-events: none;
`;

const ToastItem = styled.div<{ $isExiting: boolean }>`
  background: ${(props) => props.theme.toastBackground || "rgba(0, 0, 0, 0.8)"};
  color: ${(props) => props.theme.toastText || "#fff"};
  padding: 1rem 1.6rem;
  border-radius: 0.8rem;
  font-size: 1.4rem;
  animation: ${(props) => (props.$isExiting ? slideOut : slideIn)} 0.2s ease-out forwards;
  pointer-events: auto;
`;

// Types
interface Toast {
  id: number;
  message: string;
  isExiting: boolean;
}

interface ToastContextType {
  showToast: (message: string) => void;
}

// Context
const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

// Provider
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, isExiting: false }]);

    // Start exit animation after 1.5s
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isExiting: true } : t))
      );
    }, 1500);

    // Remove after exit animation
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 1700);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} $isExiting={toast.isExiting}>
            {toast.message}
          </ToastItem>
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
}
