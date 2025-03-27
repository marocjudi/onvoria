import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Bell, Menu } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onToggleSidebar: () => void;
  className?: string;
}

export function Header({ onToggleSidebar, className }: HeaderProps) {
  const { user, logoutMutation } = useAuth();
  const [hasNotifications] = useState(true);

  return (
    <header className={cn("bg-white shadow-sm z-10", className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <button
              onClick={onToggleSidebar}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-neutral-700 hover:text-primary hover:bg-neutral-100 focus:outline-none"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="hidden md:flex md:items-center">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-neutral-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <Input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2"
                  placeholder="Search tickets, clients..."
                />
              </div>
            </div>
          </div>
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="p-1 rounded-full text-neutral-600 hover:text-primary focus:outline-none relative"
            >
              <span className="sr-only">View notifications</span>
              <Bell className="h-6 w-6" />
              {hasNotifications && (
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white"></span>
              )}
            </Button>

            <div className="ml-3 relative">
              <div>
                <Button
                  variant="outline"
                  className="flex items-center max-w-xs rounded-full text-sm focus:outline-none p-1 border border-neutral-200 hover:border-neutral-300"
                >
                  <span className="sr-only">Open user menu</span>
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                      alt={user?.username || "User"}
                    />
                    <AvatarFallback>
                      {user?.username?.substring(0, 2).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-2 mr-2 text-left">
                    <div className="text-sm font-medium text-neutral-800">
                      {user?.username || "User"}
                    </div>
                    <div className="text-xs text-neutral-500">Admin</div>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
