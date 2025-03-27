import { useState } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { Header } from "@/components/ui/header";
import { useMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Invoice } from "@shared/schema";
import { FileText, Download, Send, Plus } from "lucide-react";

export default function InvoicesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useMobile();
  
  const { data: invoices, isLoading, isError } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
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
                <h1 className="text-2xl font-semibold text-neutral-800">Invoices</h1>
                <p className="mt-1 text-sm text-neutral-600">
                  Manage all invoices and payments
                </p>
              </div>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Invoice
              </Button>
            </div>

            {/* Invoices List */}
            <Card>
              <CardHeader className="px-6 py-5">
                <h3 className="text-lg font-medium text-neutral-900">All Invoices</h3>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-6 text-center">Loading invoices...</div>
                ) : isError ? (
                  <div className="p-6 text-center text-red-500">Failed to load invoices</div>
                ) : invoices?.length === 0 ? (
                  <div className="p-6 text-center">No invoices found</div>
                ) : (
                  <table className="min-w-full divide-y divide-neutral-200">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Invoice</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Client</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Amount</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Date</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-neutral-200">
                      {invoices?.map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-neutral-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-600">
                            <div className="flex items-center">
                              <FileText className="h-5 w-5 mr-2" />
                              #{invoice.invoiceNumber}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                            {invoice.clientName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                            ${invoice.total.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                            {invoice.date instanceof Date 
                              ? invoice.date.toLocaleDateString() 
                              : invoice.date 
                                ? new Date(invoice.date).toLocaleDateString() 
                                : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${invoice.status === "PAID" 
                                ? "bg-secondary-100 text-secondary-800" 
                                : "bg-amber-100 text-amber-800"}`}
                            >
                              {invoice.status === "PAID" ? "Paid" : "Pending"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <Button variant="ghost" size="sm" className="text-neutral-700">
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-neutral-700">
                                <Send className="h-4 w-4" />
                              </Button>
                              {invoice.status !== "PAID" && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-primary-700 border-primary-200 hover:bg-primary-50"
                                  onClick={() => window.location.href = `/checkout/${invoice.id}`}
                                >
                                  Pay Now
                                </Button>
                              )}
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
