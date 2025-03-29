import { useState } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { Header } from "@/components/ui/header";
import { useMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Payment, Invoice, insertPaymentSchema } from "@shared/schema";
import { 
  CreditCard,
  Plus, 
  Receipt, 
  Calendar, 
  DollarSign, 
  User, 
  Bookmark,
  Wallet,
  CreditCard as CreditCardIcon,
  Building
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export default function PaymentsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useMobile();
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  
  const { data: payments, isLoading, isError } = useQuery<Payment[]>({
    queryKey: ["/api/payments"],
  });

  const { data: invoices } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  // Extended payment schema with validations
  const formSchema = insertPaymentSchema.extend({
    amount: z.coerce.number().min(0.01, { message: "Amount must be greater than 0" }),
    method: z.string().min(1, { message: "Payment method is required" }),
    invoiceId: z.coerce.number().min(1, { message: "Invoice is required" }),
  });

  type PaymentFormValues = z.infer<typeof formSchema>;

  // Form for adding payments
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      method: "",
      amount: 0,
      description: "",
      reference: "",
      status: "PAID",
      date: new Date(),
    },
  });

  // Create payment mutation
  const createPaymentMutation = useMutation({
    mutationFn: async (data: PaymentFormValues) => {
      // Find the selected invoice to get clientId and clientName
      const selectedInvoice = invoices?.find(invoice => invoice.id === data.invoiceId);
      if (!selectedInvoice) {
        throw new Error("Selected invoice not found");
      }

      const paymentData = {
        ...data,
        clientId: selectedInvoice.clientId,
        clientName: selectedInvoice.clientName,
        invoiceNumber: selectedInvoice.invoiceNumber,
      };

      const response = await apiRequest("POST", "/api/payments", paymentData);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to record payment");
      }
      return response.json();
    },
    onSuccess: () => {
      setIsRecordPaymentOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: t("payments.paymentCreated"),
        description: "The payment has been successfully recorded.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRecordPayment = (values: PaymentFormValues) => {
    createPaymentMutation.mutate(values);
  };

  // Set default amount when invoice is selected
  const handleInvoiceChange = (invoiceId: number) => {
    const selectedInvoice = invoices?.find(invoice => invoice.id === invoiceId);
    if (selectedInvoice) {
      form.setValue("amount", selectedInvoice.total);
    }
  };

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case "Credit Card":
        return <CreditCardIcon className="h-4 w-4 mr-2 text-neutral-500" />;
      case "Cash":
        return <Wallet className="h-4 w-4 mr-2 text-neutral-500" />;
      case "Bank Transfer":
        return <Building className="h-4 w-4 mr-2 text-neutral-500" />;
      default:
        return <CreditCard className="h-4 w-4 mr-2 text-neutral-500" />;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-amber-100 text-amber-800";
      case "REFUNDED":
        return "bg-blue-100 text-blue-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-neutral-100 text-neutral-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "PAID":
        return t("payments.paid");
      case "PENDING":
        return t("payments.pending");
      case "REFUNDED":
        return t("payments.refunded");
      case "CANCELLED":
        return t("payments.cancelled");
      default:
        return status;
    }
  };

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
                <h1 className="text-2xl font-semibold text-neutral-800">{t("payments.newPayment")}</h1>
                <p className="mt-1 text-sm text-neutral-600">
                  {t("payments.paymentDetails")}
                </p>
              </div>
              <Button 
                className="flex items-center gap-2"
                onClick={() => setIsRecordPaymentOpen(true)}
                disabled={createPaymentMutation.isPending}
              >
                <Plus className="h-4 w-4" />
                {t("payments.newPayment")}
              </Button>
            </div>

            {/* Payments List */}
            <Card>
              <CardHeader className="px-6 py-5">
                <h3 className="text-lg font-medium text-neutral-900">{t("payments.paymentDetails")}</h3>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading || createPaymentMutation.isPending ? (
                  <div className="p-6 text-center">{t("common.loading")}</div>
                ) : isError ? (
                  <div className="p-6 text-center text-red-500">{t("common.noData")}</div>
                ) : payments?.length === 0 ? (
                  <div className="p-6 text-center">{t("common.noData")}</div>
                ) : (
                  <table className="min-w-full divide-y divide-neutral-200">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">{t("payments.invoiceNumber")}</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">{t("payments.clientName")}</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">{t("payments.amount")}</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">{t("payments.date")}</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">{t("payments.method")}</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">{t("payments.status")}</th>
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
                            {payment.date ? new Date(payment.date).toLocaleDateString() : "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                            <div className="flex items-center">
                              {getPaymentIcon(payment.method)}
                              {payment.method}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${getStatusBadgeClass(payment.status)}`}
                            >
                              {getStatusText(payment.status)}
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

      {/* Record Payment Dialog */}
      <Dialog open={isRecordPaymentOpen} onOpenChange={setIsRecordPaymentOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{t("payments.newPayment")}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleRecordPayment)} className="space-y-4">
              <FormField
                control={form.control}
                name="invoiceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("payments.invoiceNumber")}</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(parseInt(value));
                        handleInvoiceChange(parseInt(value));
                      }}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an invoice" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {invoices?.filter(invoice => invoice.status !== "PAID").map((invoice) => (
                          <SelectItem key={invoice.id} value={invoice.id.toString()}>
                            #{invoice.invoiceNumber} - {invoice.clientName} (${invoice.total.toFixed(2)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("payments.amount")}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className="absolute left-0 inset-y-0 flex items-center pl-3 pointer-events-none">
                            <DollarSign className="h-4 w-4 text-neutral-500" />
                          </div>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="0.00" 
                            className="pl-9" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("payments.method")}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Credit Card">{t("payments.creditCard")}</SelectItem>
                          <SelectItem value="Cash">{t("payments.cash")}</SelectItem>
                          <SelectItem value="Bank Transfer">{t("payments.bankTransfer")}</SelectItem>
                          <SelectItem value="PayPal">{t("payments.paypal")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>{t("payments.date")}</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("payments.status")}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PAID">{t("payments.paid")}</SelectItem>
                          <SelectItem value="PENDING">{t("payments.pending")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("payments.reference")}</FormLabel>
                    <FormControl>
                      <Input placeholder="Transaction ID or reference number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("payments.description")}</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter any additional notes about this payment"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="submit"
                  disabled={createPaymentMutation.isPending}
                  className="w-full md:w-auto"
                >
                  {createPaymentMutation.isPending ? t("common.loading") : t("common.save")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
