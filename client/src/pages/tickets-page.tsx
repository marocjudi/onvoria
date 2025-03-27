import { useState } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { Header } from "@/components/ui/header";
import { TicketList } from "@/components/dashboard/ticket-list";
import { useMobile } from "@/hooks/use-mobile";

export default function TicketsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useMobile();

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
              <h1 className="text-2xl font-semibold text-neutral-800">Tickets</h1>
              <p className="mt-1 text-sm text-neutral-600">
                Manage all repair tickets
              </p>
            </div>

            {/* Ticket List */}
            <TicketList />
          </div>
        </main>
      </div>
    </div>
  );
}
