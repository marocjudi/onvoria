import { useState, useEffect } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { Header } from "@/components/ui/header";
import { useMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Invoice, insertInvoiceSchema, InsertInvoice, Client, Ticket } from "@shared/schema";
import { FileText, Download, Send, Plus, Trash, Calendar, PlusCircle, MinusCircle } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, addDays } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "react-i18next";

export default function InvoicesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useMobile();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);
  
  const { data: invoices, isLoading, isError } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: tickets } = useQuery<Ticket[]>({
    queryKey: ["/api/tickets"],
  });

  // Invoice form schema with validations
  const formSchema = insertInvoiceSchema.extend({
    clientId: z.coerce.number().min(1, { message: "Client is required" }),
    ticketId: z.coerce.number().min(1, { message: "Ticket is required" }),
    invoiceNumber: z.string().min(1, { message: "Invoice number is required" }),
    subTotal: z.coerce.number().min(0),
    tax: z.coerce.number().min(0),
    total: z.coerce.number().min(0),
    dueDate: z.date(),
    items: z.array(
      z.object({
        description: z.string().min(1, { message: "Description is required" }),
        quantity: z.coerce.number().min(1, { message: "Quantity must be at least 1" }),
        unitPrice: z.coerce.number().min(0, { message: "Price must be positive" }),
        total: z.coerce.number().min(0)
      })
    ).min(1, { message: "At least one item is required" })
  });

  type InvoiceFormValues = z.infer<typeof formSchema>;

  // Form for creating invoices
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      invoiceNumber: `INV-${new Date().getTime().toString().slice(-6)}`,
      subTotal: 0,
      tax: 0,
      total: 0,
      dueDate: addDays(new Date(), 30),
      items: [
        { description: "", quantity: 1, unitPrice: 0, total: 0 }
      ]
    }
  });

  // Handle items field array
  const { fields, append, remove } = useFieldArray({
    name: "items",
    control: form.control
  });

  // Create invoice mutation
  const createInvoiceMutation = useMutation({
    mutationFn: async (data: InvoiceFormValues) => {
      const response = await apiRequest("POST", "/api/invoices", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: t("invoices.createdSuccess"),
        description: t("invoices.createdSuccessDesc"),
      });
      setIsNewInvoiceOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: t("invoices.createError"),
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle form submission
  const handleCreateInvoice = (data: InvoiceFormValues) => {
    // Get client name from selected client
    const selectedClient = clients?.find(client => client.id === data.clientId);
    if (!selectedClient) {
      toast({
        title: t("invoices.error"),
        description: t("invoices.clientNotFound"),
        variant: "destructive",
      });
      return;
    }

    // Submit with client name
    createInvoiceMutation.mutate({
      ...data,
      clientName: selectedClient.name
    });
  };

  // Calculate subtotal, tax, and total
  useEffect(() => {
    const watchedItems = form.watch("items");
    
    // Calculate item totals first
    watchedItems.forEach((item, index) => {
      const total = (item.quantity || 0) * (item.unitPrice || 0);
      if (total !== item.total) {
        form.setValue(`items.${index}.total`, total);
      }
    });
    
    // Then calculate invoice totals
    const subTotal = watchedItems.reduce((sum, item) => sum + (item.total || 0), 0);
    const taxRate = 0.07; // 7% tax rate
    const tax = Math.round(subTotal * taxRate * 100) / 100;
    const total = subTotal + tax;
    
    form.setValue("subTotal", subTotal);
    form.setValue("tax", tax);
    form.setValue("total", total);
  }, [form.watch("items")]);

  // Handle client selection
  const handleClientChange = (clientId: number) => {
    // Filter tickets by client
    const clientTickets = tickets?.filter(ticket => ticket.clientId === clientId);
    
    // If there's only one ticket for this client, auto-select it
    if (clientTickets && clientTickets.length === 1) {
      form.setValue("ticketId", clientTickets[0].id);
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
                <h1 className="text-2xl font-semibold text-neutral-800">{t("invoices.title")}</h1>
                <p className="mt-1 text-sm text-neutral-600">
                  {t("invoices.subtitle")}
                </p>
              </div>
              <Button 
                className="flex items-center gap-2"
                onClick={() => setIsNewInvoiceOpen(true)}
              >
                <Plus className="h-4 w-4" />
                {t("invoices.new")}
              </Button>
            </div>

            {/* Invoices List */}
            <Card>
              <CardHeader className="px-6 py-5">
                <h3 className="text-lg font-medium text-neutral-900">{t("invoices.allInvoices")}</h3>
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
                              {invoice.status === "PAID" ? t("payments.paid") : t("payments.pending")}
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
                                  {t("invoices.payNow")}
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

      {/* Create Invoice Dialog */}
      <Dialog open={isNewInvoiceOpen} onOpenChange={setIsNewInvoiceOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>{t("invoices.createNew")}</DialogTitle>
            <DialogDescription>
              {t("invoices.createDesc")}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateInvoice)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Client Selection */}
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("invoices.client")}</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(parseInt(value));
                          handleClientChange(parseInt(value));
                        }}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("invoices.selectClient")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clients?.map((client) => (
                            <SelectItem key={client.id} value={client.id.toString()}>
                              {client.name} {client.company ? `(${client.company})` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Ticket Selection */}
                <FormField
                  control={form.control}
                  name="ticketId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("invoices.ticket")}</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("invoices.selectTicket")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tickets
                            ?.filter(ticket => !form.getValues().clientId || ticket.clientId === form.getValues().clientId)
                            .map((ticket) => (
                              <SelectItem key={ticket.id} value={ticket.id.toString()}>
                                #{ticket.id} - {ticket.deviceType} ({ticket.issueType})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Invoice Number */}
                <FormField
                  control={form.control}
                  name="invoiceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("invoices.number")}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Due Date */}
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>{t("invoices.dueDate")}</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className="pl-3 text-left font-normal"
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>{t("invoices.pickDate")}</span>
                              )}
                              <Calendar className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date()
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Invoice Items */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">{t("invoices.items")}</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ description: "", quantity: 1, unitPrice: 0, total: 0 })}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    {t("invoices.addItem")}
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-5">
                      <FormField
                        control={form.control}
                        name={`items.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={index !== 0 ? "sr-only" : undefined}>
                              {t("invoices.description")}
                            </FormLabel>
                            <FormControl>
                              <Input {...field} placeholder={t("invoices.descriptionPlaceholder")} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={index !== 0 ? "sr-only" : undefined}>
                              {t("invoices.quantity")}
                            </FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                min="1" 
                                step="1" 
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.unitPrice`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={index !== 0 ? "sr-only" : undefined}>
                              {t("invoices.unitPrice")}
                            </FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                min="0" 
                                step="0.01" 
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.total`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={index !== 0 ? "sr-only" : undefined}>
                              {t("invoices.total")}
                            </FormLabel>
                            <FormControl>
                              <Input {...field} readOnly className="bg-neutral-50" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-1">
                      {index > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                          className="text-red-500 mt-6"
                        >
                          <Trash className="h-4 w-4" />
                          <span className="sr-only">{t("invoices.removeItem")}</span>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-2 border-t border-neutral-200 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{t("invoices.subtotal")}</span>
                  <span>${form.watch("subTotal").toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{t("invoices.tax")} (7%)</span>
                  <span>${form.watch("tax").toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-neutral-200 pt-2">
                  <span>{t("invoices.total")}</span>
                  <span>${form.watch("total").toFixed(2)}</span>
                </div>
              </div>

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("invoices.notes")}</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder={t("invoices.notesPlaceholder")} 
                        value={field.value || ''} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsNewInvoiceOpen(false)}
                >
                  {t("common.cancel")}
                </Button>
                <Button type="submit" disabled={createInvoiceMutation.isPending}>
                  {createInvoiceMutation.isPending ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                      {t("common.creating")}
                    </>
                  ) : (
                    t("invoices.create")
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
