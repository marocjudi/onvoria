import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Payment } from "@shared/schema";
import { Calendar, User, CheckCircle, MinusCircle } from "lucide-react";

export function PaymentList() {
  const {
    data: payments,
    isLoading,
    isError,
  } = useQuery<Payment[]>({
    queryKey: ["/api/payments"],
  });

  return (
    <Card>
      <CardHeader className="px-4 py-5 sm:px-6 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h3 className="text-lg leading-6 font-medium text-neutral-900">
            Recent Payments
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-neutral-500">
            Latest transactions and invoices
          </p>
        </div>
        <Button variant="secondary" className="bg-primary-100 text-primary-700 hover:bg-primary-200">
          View All
        </Button>
      </CardHeader>

      <CardContent className="border-t border-neutral-200 px-0 py-0">
        {isLoading ? (
          <div className="space-y-6 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-[120px] mb-2" />
                    <Skeleton className="h-3 w-[180px]" />
                  </div>
                </div>
                <Skeleton className="h-4 w-[80px]" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="p-8 text-center">
            <p className="text-red-500">
              Failed to load payments. Please try again.
            </p>
          </div>
        ) : payments?.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-neutral-500">No payments found.</p>
          </div>
        ) : (
          <div className="overflow-hidden">
            <ul role="list" className="divide-y divide-neutral-200">
              {payments?.map((payment) => (
                <li key={payment.id}>
                  <div className="px-4 py-4 sm:px-6 hover:bg-neutral-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          {payment.status === "PAID" ? (
                            <CheckCircle className="h-8 w-8 text-secondary-500" />
                          ) : (
                            <MinusCircle className="h-8 w-8 text-amber-500" />
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-neutral-900">
                            #{payment.invoiceNumber}
                          </div>
                          <div className="text-sm text-neutral-500">
                            {payment.description}
                          </div>
                        </div>
                      </div>
                      <div className="ml-2 flex-shrink-0 flex">
                        <div className="text-sm text-neutral-900 font-medium text-right">
                          ${payment.amount.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-neutral-500">
                          <User className="flex-shrink-0 mr-1.5 h-5 w-5 text-neutral-400" />
                          {payment.clientName}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-neutral-500 sm:mt-0">
                        <Calendar className="flex-shrink-0 mr-1.5 h-5 w-5 text-neutral-400" />
                        <p>
                          <span>
                            {payment.status === "PAID" ? "Paid on " : "Pending since "}
                          </span>
                          <time dateTime={payment.date.toString()}>
                            {new Date(payment.date).toLocaleDateString("en-US", {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </time>
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
