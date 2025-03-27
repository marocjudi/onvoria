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
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();

  const navigationItems = [
    {
      title: "Main",
      items: [
        {
          name: "Dashboard",
          href: "/",
          icon: LayoutDashboard,
          current: location === "/",
        },
        {
          name: "Tickets",
          href: "/tickets",
          icon: Ticket,
          current: location === "/tickets",
        },
        {
          name: "Invoices",
          href: "/invoices",
          icon: FileText,
          current: location === "/invoices",
        },
        {
          name: "Payments",
          href: "/payments",
          icon: DollarSign,
          current: location === "/payments",
        },
        {
          name: "Clients",
          href: "/clients",
          icon: Users,
          current: location === "/clients",
        },
      ],
    },
    {
      title: "Settings",
      items: [
        {
          name: "Settings",
          href: "/settings",
          icon: Settings,
          current: location === "/settings",
        },
        {
          name: "Help & Support",
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
    </div>
  );
}
