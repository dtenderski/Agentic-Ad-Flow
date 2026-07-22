import { cn } from "@/lib/utils";
import { SiFacebook, SiGoogle, SiTiktok } from "react-icons/si";
import { Linkedin } from "lucide-react";
import type { ComponentType } from "react";

export type AdPlatform = "meta" | "google" | "tiktok" | "linkedin";

interface PlatformConfigEntry {
  label: string;
  Icon: ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  border: string;
  cardBg: string;
  cardActive: string;
}

export const PLATFORM_CONFIG: Record<AdPlatform, PlatformConfigEntry> = {
  meta: {
    label: "Meta",
    Icon: SiFacebook,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    cardBg: "bg-blue-500/10 border-blue-500/30",
    cardActive: "bg-blue-500/20 border-blue-500",
  },
  google: {
    label: "Google Ads",
    Icon: SiGoogle,
    color: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    cardBg: "bg-red-500/10 border-red-500/30",
    cardActive: "bg-red-500/20 border-red-500",
  },
  tiktok: {
    label: "TikTok",
    Icon: SiTiktok,
    color: "text-pink-400",
    bg: "bg-pink-500/10",
    border: "border-pink-500/30",
    cardBg: "bg-pink-500/10 border-pink-500/30",
    cardActive: "bg-pink-500/20 border-pink-500",
  },
  linkedin: {
    label: "LinkedIn",
    Icon: Linkedin,
    color: "text-sky-500",
    bg: "bg-sky-500/10",
    border: "border-sky-500/30",
    cardBg: "bg-sky-500/10 border-sky-500/30",
    cardActive: "bg-sky-500/20 border-sky-500",
  },
};

interface PlatformBadgeProps {
  platform: AdPlatform | string;
  size?: "sm" | "md";
  className?: string;
}

export function PlatformBadge({ platform, size = "sm", className }: PlatformBadgeProps) {
  const key = (platform ?? "meta") as AdPlatform;
  const config = PLATFORM_CONFIG[key] ?? PLATFORM_CONFIG.meta;
  const Icon = config.Icon;

  if (size === "md") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border",
          config.bg,
          config.border,
          config.color,
          className
        )}
      >
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border",
        config.bg,
        config.border,
        config.color,
        className
      )}
    >
      <Icon className="w-2.5 h-2.5" />
      {config.label}
    </span>
  );
}
