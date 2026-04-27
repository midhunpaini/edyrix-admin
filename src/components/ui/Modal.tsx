import { useEffect } from "react";
import { Icon } from "./Icon";
import { Icons } from "../../lib/icons";
import { clsx } from "clsx";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

export function Modal({ open, onClose, title, children, size = "md" }: ModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className={clsx("relative z-10 bg-white rounded-2xl shadow-2xl w-full", {
        "max-w-sm": size === "sm",
        "max-w-lg": size === "md",
        "max-w-2xl": size === "lg",
      })}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-ink/8">
            <h3 className="font-display font-bold text-lg text-ink">{title}</h3>
            <button
              onClick={onClose}
              className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg hover:bg-ink/5"
              aria-label="Close"
            >
              <Icon name={Icons.close} size={18} className="text-ink-3" aria-hidden />
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
