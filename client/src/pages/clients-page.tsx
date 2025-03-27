import { useState } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { Header } from "@/components/ui/header";
import { useMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Client } from "@shared/schema";
import { User, Mail, Phone, Plus, Edit, Trash2 } from "lucide-react";

export default function ClientsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useMobile();
  
  const { data: clients, isLoading, isError } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
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
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-semibold text-neutral-800">Clients</h1>
                <p className="mt-1 text-sm text-neutral-600">
                  Manage your client database
                </p>
              </div>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Client
              </Button>
            </div>

            {/* Clients List */}
            <Card>
              <CardHeader className="px-6 py-5">
                <h3 className="text-lg font-medium text-neutral-900">All Clients</h3>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-6 text-center">Loading clients...</div>
                ) : isError ? (
                  <div className="p-6 text-center text-red-500">Failed to load clients</div>
                ) : clients?.length === 0 ? (
                  <div className="p-6 text-center">No clients found</div>
                ) : (
                  <table className="min-w-full divide-y divide-neutral-200">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Name</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Email</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Phone</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Tickets</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-neutral-200">
                      {clients?.map((client) => (
                        <tr key={client.id} className="hover:bg-neutral-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-neutral-200 rounded-full flex items-center justify-center">
                                <User className="h-5 w-5 text-neutral-600" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-neutral-900">{client.name}</div>
                                <div className="text-sm text-neutral-500">{client.company || "Individual"}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-neutral-700">
                              <Mail className="mr-2 h-4 w-4 text-neutral-500" />
                              {client.email}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-neutral-700">
                              <Phone className="mr-2 h-4 w-4 text-neutral-500" />
                              {client.phone}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                            {client.ticketCount || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <Button variant="ghost" size="sm" className="text-neutral-700">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-red-600">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
