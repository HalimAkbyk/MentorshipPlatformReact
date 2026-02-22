"use client";

import * as React from "react";
import { cn } from "../../lib/utils/cn";

interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value?: number;
  onValueChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  formatValue?: (value: number) => string;
  showValue?: boolean;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      className,
      value = 0,
      onValueChange,
      min = 0,
      max = 100,
      step = 1,
      formatValue,
      showValue = true,
      ...props
    },
    ref
  ) => {
    const percentage = ((value - min) / (max - min)) * 100;
    const displayValue = formatValue ? formatValue(value) : String(value);

    return (
      <div className={cn("w-full space-y-2", className)}>
        {showValue && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">{formatValue ? formatValue(min) : min}</span>
            <span className="text-lg font-semibold text-teal-700">{displayValue}</span>
            <span className="text-gray-500">{formatValue ? formatValue(max) : max}</span>
          </div>
        )}
        <div className="relative">
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-500 to-green-500 transition-all"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <input
            ref={ref}
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onValueChange?.(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            {...props}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-2 border-teal-500 shadow-md pointer-events-none transition-all"
            style={{ left: `calc(${percentage}% - 10px)` }}
          />
        </div>
      </div>
    );
  }
);
Slider.displayName = "Slider";

export { Slider };
