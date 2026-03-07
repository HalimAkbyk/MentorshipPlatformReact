import * as React from "react";
import { cn } from "../../lib/utils/cn";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

/**
 * When type="number", uses an internal string state to allow:
 * - Clearing the field (backspace/delete works on "0")
 * - No leading zeros ("05" → "5")
 * - Empty field while typing
 * Falls back to standard input for all other types.
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, value, defaultValue, onChange, onBlur, ...props }, ref) => {
    const isNumber = type === "number";

    // Internal string state for number inputs
    const [internalValue, setInternalValue] = React.useState<string>(() => {
      if (!isNumber) return "";
      const v = value ?? defaultValue;
      if (v === undefined || v === null || v === "") return "";
      return String(v);
    });

    // Track if user cleared the field — prevents external "0" from overwriting empty
    const userClearedRef = React.useRef(false);

    // Sync external value → internal string
    React.useEffect(() => {
      if (!isNumber) return;
      // If user intentionally cleared, don't sync back "0"
      if (userClearedRef.current && (value === 0 || value === "0")) return;

      const strVal = value === undefined || value === null || value === "" ? "" : String(value);
      setInternalValue((prev) => {
        if (prev === strVal) return prev;
        // Don't override intermediate states (e.g., "3." while typing "3.5")
        const prevNum = parseFloat(prev);
        const extNum = parseFloat(strVal);
        if (!isNaN(prevNum) && !isNaN(extNum) && prevNum === extNum) return prev;
        userClearedRef.current = false;
        return strVal;
      });
    }, [isNumber, value]);

    const handleNumberChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;

        // Allow empty
        if (raw === "") {
          setInternalValue("");
          userClearedRef.current = true;
          onChange?.(e);
          return;
        }

        // Allow intermediate states: "-", ".", "-."
        if (/^-?\.?$/.test(raw)) {
          setInternalValue(raw);
          userClearedRef.current = false;
          return; // Don't fire onChange for incomplete values
        }

        // Allow valid number patterns (digits with optional decimal)
        if (/^-?\d*\.?\d*$/.test(raw)) {
          setInternalValue(raw);
          userClearedRef.current = false;
          onChange?.(e);
        }
        // Reject anything else (letters, symbols, etc.)
      },
      [onChange]
    );

    const handleNumberBlur = React.useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        // On blur, clean up the display value
        const val = internalValue;
        if (val !== "" && val !== "-" && val !== ".") {
          const num = parseFloat(val);
          if (!isNaN(num)) {
            const cleaned = String(num);
            if (cleaned !== val) {
              setInternalValue(cleaned);
            }
          }
        }
        userClearedRef.current = false;
        onBlur?.(e);
      },
      [internalValue, onBlur]
    );

    if (isNumber) {
      // Extract min/max/step — not applicable to text inputs
      const { min: _min, max: _max, step: _step, ...restProps } = props;
      return (
        <input
          type="text"
          inputMode="decimal"
          className={cn(
            "flex h-11 w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
            className
          )}
          ref={ref}
          value={internalValue}
          onChange={handleNumberChange}
          onBlur={handleNumberBlur}
          {...restProps}
        />
      );
    }

    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
          className
        )}
        ref={ref}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        onBlur={onBlur}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
