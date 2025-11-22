'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
};

export function Modal({ open, onClose, title, children, actions }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handle = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [open, onClose]);

  if (typeof document === 'undefined' || !open) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={clsx(
          'w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl',
          'animate-[fadeIn_0.2s_ease-out]'
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            type="button"
            className="text-gray-400 transition hover:text-gray-600"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="space-y-4 text-sm text-gray-700">{children}</div>
        {actions && <div className="mt-6 flex justify-end gap-3">{actions}</div>}
      </div>
    </div>,
    document.body
  );
}
