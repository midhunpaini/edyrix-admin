interface IconProps {
  name: string;
  size?: number;
  className?: string;
  filled?: boolean;
  "aria-hidden"?: boolean;
  "aria-label"?: string;
}

export function Icon({
  name,
  size = 24,
  className = "",
  filled = false,
  "aria-hidden": ariaHidden = true,
  "aria-label": ariaLabel,
}: IconProps) {
  return (
    <span
      className={`material-symbols-outlined select-none${filled ? " font-variation-filled" : ""}${className ? ` ${className}` : ""}`}
      style={{ fontSize: size, lineHeight: 1, fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0" }}
      aria-hidden={ariaHidden || !ariaLabel}
      aria-label={ariaLabel}
      role={ariaLabel ? "img" : undefined}
    >
      {name}
    </span>
  );
}
