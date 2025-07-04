"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface LogoutButtonProps {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  children?: React.ReactNode;
  immediate?: boolean; // Optional prop to force immediate logout
}

export function LogoutButton({
  variant = "outline",
  size = "default",
  className = "ml-auto",
  children,
  immediate = false,
}: LogoutButtonProps) {
  const router = useRouter();

  const handleLogout = () => {
    if (immediate) {
      // Use immediate logout for security-critical scenarios
      router.push("/logout/immediate");
    } else {
      // Use confirmation logout for normal user-initiated logouts
      router.push("/logout");
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleLogout}
      className={className}
    >
      {children || "Sign Out"}
    </Button>
  );
}
