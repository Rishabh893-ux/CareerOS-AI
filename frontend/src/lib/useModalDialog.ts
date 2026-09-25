"use client";

import { useEffect, useRef } from "react";

/**
 * Shared modal behavior: closes on Escape, moves focus into the dialog when it
 * opens, and hands focus back to whatever opened it when it closes.
 * Attach the returned ref to the dialog panel (the element with role="dialog").
 */
export function useModalDialog<T extends HTMLElement>(isOpen: boolean, onClose: () => void) {
  const dialogRef = useRef<T>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const opener = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const firstField = dialog?.querySelector<HTMLElement>("input, textarea, select");
    (firstField ?? dialog)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      opener?.focus?.();
    };
  }, [isOpen]);

  return dialogRef;
}
