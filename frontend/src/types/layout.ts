import type { LucideIcon } from "lucide-react";
import type { MouseEvent } from "react";

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  external?: boolean;
  /** When set, clicking the item runs this instead of navigating to `href`. */
  onClick?: (e: MouseEvent) => void;
}

export interface UserData {
  name?: string;
  username?: string;
}

export interface ChatMessage {
  sender: "user" | "ai";
  text: string;
}
