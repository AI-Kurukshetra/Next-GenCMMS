"use client";

import { useRef, useState } from "react";

type ServerActionFormProps = {
  action: (formData: FormData) => Promise<void>;
  children: React.ReactNode;
  resetOnSuccess?: boolean;
  successMessage?: string;
} & Omit<React.FormHTMLAttributes<HTMLFormElement>, "action" | "children">;

export function ServerActionForm({
  action,
  children,
  resetOnSuccess = false,
  successMessage,
  className,
  ...props
}: ServerActionFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleAction(formData: FormData) {
    setError(null);
    setSuccess(null);

    try {
      await action(formData);
      if (resetOnSuccess) {
        formRef.current?.reset();
      }
      if (successMessage) {
        setSuccess(successMessage);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <form ref={formRef} action={handleAction} className={className} {...props}>
      {children}
      {error ? (
        <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {success}
        </p>
      ) : null}
    </form>
  );
}
