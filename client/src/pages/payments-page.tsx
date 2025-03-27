import { useState } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { Header } from "@/components/ui/header";
import { useMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Payment } from "@shared/schema";
import { CreditCard, Plus } from "lucide-react";

export default function PaymentsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useMobile();
  
  const { data: payments, isLoading, isError } = useQuery<Payment[]>({
    queryKey: ["/api/payments"],
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
                <h1 className="text-2xl font-semibold text-neutral-800">Payments</h1>
                <p className="mt-1 text-sm text-neutral-600">
                  Manage all payment transactions
                </p>
              </div>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Record Payment
              </Button>
            </div>

            {/* Payments List */}
            <Card>
              <CardHeader className="px-6 py-5">
                <h3 className="text-lg font-medium text-neutral-900">All Payments</h3>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-6 text-center">Loading payments...</div>
                ) : isError ? (
                  <div className="p-6 text-center text-red-500">Failed to load payments</div>
                ) : payments?.length === 0 ? (
                  <div className="p-6 text-center">No payments found</div>
                ) : (
                  <table className="min-w-full divide-y divide-neutral-200">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Invoice</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Client</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Amount</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Date</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Method</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-neutral-200">
                      {payments?.map((payment) => (
                        <tr key={payment.id} className="hover:bg-neutral-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-600">
                            #{payment.invoiceNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                            {payment.clientName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                            ${payment.amount.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                            {new Date(payment.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                            <div className="flex items-center">
                              <CreditCard className="h-4 w-4 mr-2 text-neutral-500" />
                              {payment.method}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${payment.status === "PAID" 
                                ? "bg-secondary-100 text-secondary-800" 
                                : "bg-amber-100 text-amber-800"}`}
                            >
                              {payment.status === "PAID" ? "Paid" : "Pending"}
                            </span>
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
