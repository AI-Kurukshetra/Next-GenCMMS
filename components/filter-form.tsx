'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

interface FilterField {
  name: string;
  label: string;
  type: 'text' | 'select';
  placeholder?: string;
  options?: { value: string; label: string }[];
}

interface FilterFormProps {
  fields: FilterField[];
  onFilter?: (params: Record<string, string>) => void;
}

export function FilterForm({ fields, onFilter }: FilterFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [values, setValues] = useState(
    fields.reduce((acc, field) => {
      acc[field.name] = searchParams.get(field.name) || '';
      return acc;
    }, {} as Record<string, string>)
  );

  const handleChange = (name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const params = new URLSearchParams();
    Object.entries(values).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });

    const queryString = params.toString();
    const newUrl = queryString ? `?${queryString}` : window.location.pathname;
    router.push(newUrl);

    if (onFilter) {
      onFilter(values);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-4">
      {fields.map((field) => (
        <div key={field.name}>
          {field.type === 'text' ? (
            <input
              name={field.name}
              value={values[field.name]}
              onChange={(e) => handleChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          ) : (
            <select
              name={field.name}
              value={values[field.name]}
              onChange={(e) => handleChange(field.name, e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">{field.label}</option>
              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        </div>
      ))}
      <button type="submit" className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition">
        Apply Filters
      </button>
    </form>
  );
}
