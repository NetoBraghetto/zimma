import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { tagBadgeStyle } from "@/constants/tag";
import { TagIcons } from "@/constants/tag-icons";

type TagBadgeProps = {
  name: ReactNode;
  color: string;
  icon?: string;
};

export function TagBadge({ name, color, icon }: TagBadgeProps): ReactNode {
  const Icon = icon ? TagIcons[icon]?.icon : undefined;

  return (
    <Badge size="lg" shape="round" style={tagBadgeStyle(color)}>
      {Icon ? <Icon aria-hidden="true" /> : null}
      {name}
    </Badge>
  );
}
