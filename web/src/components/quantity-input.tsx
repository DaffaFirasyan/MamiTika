"use client";

import { useId, useState } from "react";

type QuantityInputProps = {
  value: number;
  label: string;
  onChange(value: number): void;
  onInvalidChange?(invalid: boolean): void;
};

export function QuantityInput({ value, label, onChange, onInvalidChange }: QuantityInputProps) {
  const errorId = useId();
  const [inputValue, setInputValue] = useState(String(value));
  const [invalid, setInvalid] = useState(false);

  function update(next: number) {
    setInputValue(String(next));
    setInvalid(false);
    onInvalidChange?.(false);
    onChange(next);
  }

  return (
    <div className="quantity-control">
      <button type="button" aria-label={`Kurangi ${label}`} disabled={value <= 1} onClick={() => update(value - 1)}>−</button>
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={Number.MAX_SAFE_INTEGER}
        step={1}
        value={inputValue}
        aria-label={`Jumlah ${label}`}
        aria-invalid={invalid}
        aria-describedby={invalid ? errorId : undefined}
        onChange={(event) => {
          const nextValue = event.currentTarget.value;
          setInputValue(nextValue);
          const next = Number(nextValue);
          const valid = /^\d+$/.test(nextValue) && Number.isSafeInteger(next) && next >= 1;
          setInvalid(!valid);
          onInvalidChange?.(!valid);
          if (valid) onChange(next);
        }}
      />
      <button type="button" aria-label={`Tambah jumlah ${label}`} disabled={!Number.isSafeInteger(value + 1)} onClick={() => update(value + 1)}>+</button>
      {invalid && <span className="quantity-error" id={errorId} role="alert">Jumlah harus bilangan bulat minimal 1.</span>}
    </div>
  );
}
