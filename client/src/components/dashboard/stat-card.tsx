import { ReactNode } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  link?: {
    text: string;
    href: string;
  };
  className?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  iconColor = "text-primary-600",
  iconBgColor = "bg-primary-100",
  link,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-5">
        <div className="flex items-center">
          <div
            className={cn(
              "flex-shrink-0 rounded-md p-3",
              iconBgColor
            )}
          >
            <Icon className={cn("h-6 w-6", iconColor)} />
          </div>
          <div className="ml-5 w-0 flex-1">
            <div>
              <div className="text-sm font-medium text-neutral-500 truncate">
                {title}
              </div>
              <div className="text-lg font-medium text-neutral-900">
                {value}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      {link && (
        <CardFooter className="bg-neutral-50 px-5 py-3">
          <div className="text-sm">
            <a
              href={link.href}
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              {link.text}
            </a>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
