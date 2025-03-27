import { useState } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { Header } from "@/components/ui/header";
import { StatCard } from "@/components/dashboard/stat-card";
import { TicketList } from "@/components/dashboard/ticket-list";
import { PaymentList } from "@/components/dashboard/payment-list";
import { NotificationPanel } from "@/components/dashboard/notification-panel";
import { QuickActionPanel } from "@/components/dashboard/quick-action-panel";
import { CheckCircle, DollarSign, Clock, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useMobile } from "@/hooks/use-mobile";

export default function HomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useMobile();

  // Dashboard stats query
  const { data: stats } = useQuery<{
    activeTickets: number;
    monthlyRevenue: number;
    avgResolutionTime: string;
    urgentRepairs: number;
  }>({
    queryKey: ["/api/dashboard/stats"],
  });

  return (
    <div className="bg-neutral-100 h-screen flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar className={`${isMobile && !sidebarOpen ? "hidden" : "md:block"} ${isMobile ? "absolute z-50 h-full" : ""}`} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-neutral-50">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-neutral-800">Dashboard</h1>
              <p className="mt-1 text-sm text-neutral-600">
                Overview of your repair service business
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              <StatCard
                title="Active Tickets"
                value={stats?.activeTickets || 0}
                icon={CheckCircle}
                iconColor="text-primary-600"
                iconBgColor="bg-primary-100"
                link={{ text: "View all", href: "/tickets" }}
              />
              <StatCard
                title="Revenue (Month)"
                value={`$${stats?.monthlyRevenue?.toFixed(2) || "0.00"}`}
                icon={DollarSign}
                iconColor="text-secondary-600"
                iconBgColor="bg-secondary-100"
                link={{ text: "View details", href: "/payments" }}
              />
              <StatCard
                title="Avg. Resolution Time"
                value={stats?.avgResolutionTime || "0 days"}
                icon={Clock}
                iconColor="text-amber-600"
                iconBgColor="bg-amber-100"
                link={{ text: "View analytics", href: "/analytics" }}
              />
              <StatCard
                title="Urgent Repairs"
                value={stats?.urgentRepairs || 0}
                icon={AlertTriangle}
                iconColor="text-red-600"
                iconBgColor="bg-red-100"
                link={{ text: "View all", href: "/tickets?priority=urgent" }}
              />
            </div>

            {/* Recent Tickets & Payments */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 mb-8">
              <TicketList />
              <PaymentList />
            </div>

            {/* Quick Actions & Notifications */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              <QuickActionPanel />
              <NotificationPanel />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
