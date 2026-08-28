import type { ComponentProps } from "react";

type ButtonProps = ComponentProps<"button"> & {
  variant?: "primary" | "secondary" | "quiet";
};

export function Button({ className = "", variant = "primary", type = "button", ...props }: ButtonProps) {
  return <button className={["button", "button--" + variant, className].filter(Boolean).join(" ")} type={type} {...props} />;
}
