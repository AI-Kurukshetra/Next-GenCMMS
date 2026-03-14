"use client";

import { useFormStatus } from "react-dom";
import clsx from "clsx";

type FormSubmitButtonProps = {
  children: React.ReactNode;
  pendingText: string;
  className?: string;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children">;

export function FormSubmitButton({
  children,
  pendingText,
  className,
  disabled,
  ...props
}: FormSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      {...props}
      disabled={disabled || pending}
      aria-disabled={disabled || pending}
      className={clsx("disabled:cursor-not-allowed disabled:opacity-70", className)}
    >
      {pending ? pendingText : children}
    </button>
  );
}
