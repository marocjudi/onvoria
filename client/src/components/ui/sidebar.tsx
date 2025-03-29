import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Ticket,
  FileText,
  DollarSign,
  Users,
  Settings,
  HelpCircle,
  Wrench,
  LogOut,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { LanguageSelector } from "./language-selector";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { t } = useTranslation();
  const { logoutMutation } = useAuth();

  const navigationItems = [
    {
      title: t("common.dashboard"),
      items: [
        {
          name: t("common.dashboard"),
          href: "/",
          icon: LayoutDashboard,
          current: location === "/",
        },
        {
          name: t("common.tickets"),
          href: "/tickets",
          icon: Ticket,
          current: location === "/tickets",
        },
        {
          name: t("common.invoices"),
          href: "/invoices",
          icon: FileText,
          current: location === "/invoices",
        },
        {
          name: t("common.payments"),
          href: "/payments",
          icon: DollarSign,
          current: location === "/payments",
        },
        {
          name: t("common.clients"),
          href: "/clients",
          icon: Users,
          current: location === "/clients",
        },
      ],
    },
    {
      title: t("common.settings"),
      items: [
        {
          name: t("common.settings"),
          href: "/settings",
          icon: Settings,
          current: location === "/settings",
        },
        {
          name: t("common.help"),
          href: "/help",
          icon: HelpCircle,
          current: location === "/help",
        },
      ],
    },
  ];

  return (
    <div
      className={cn(
        "bg-white w-64 h-screen shadow-md flex-shrink-0 z-10 border-r border-neutral-200 flex flex-col",
        className
      )}
    >
      <div className="flex items-center justify-center h-16 border-b border-neutral-200">
        <h1 className="text-xl font-bold text-primary">
          <span className="flex items-center gap-2">
            <Wrench className="h-8 w-8" />
            Onvaria
          </span>
        </h1>
      </div>

      <div className="py-4 px-3 flex-1 overflow-y-auto">
        {navigationItems.map((group) => (
          <div key={group.title} className="mb-8">
            <p className="px-4 text-xs text-neutral-500 font-medium uppercase tracking-wider mb-2">
              {group.title}
            </p>
            <ul>
              {group.items.map((item) => (
                <li key={item.name} className="mb-1">
                  <Link href={item.href}>
                    <a
                      className={cn(
                        "flex items-center px-4 py-2 text-sm font-medium rounded-md",
                        item.current
                          ? "text-white bg-primary"
                          : "text-neutral-700 hover:bg-neutral-100"
                      )}
                    >
                      <item.icon className="h-5 w-5 mr-3" />
                      {item.name}
                    </a>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Language selector and logout */}
      <div className="border-t border-neutral-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <LanguageSelector />
          <button
            onClick={() => logoutMutation.mutate()}
            className="flex items-center text-sm text-neutral-700 hover:text-primary"
          >
            <LogOut className="h-4 w-4 mr-2" />
            {t("common.logout")}
          </button>
        </div>
      </div>
    </div>
  );
}
