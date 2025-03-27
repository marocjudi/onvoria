import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText } from "lucide-react";
import { Ticket } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Client } from "@shared/schema";

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Ticket, "id" | "statusHistory">) => void;
  ticket?: Partial<Ticket>;
}

const deviceTypes = [
  { value: "smartphone", label: "Smartphone" },
  { value: "tablet", label: "Tablet" },
  { value: "laptop", label: "Laptop" },
  { value: "desktop", label: "Desktop" },
  { value: "smartwatch", label: "Smartwatch" },
  { value: "other", label: "Other" },
];

const priorities = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const ticketSchema = z.object({
  clientId: z.number().min(1, { message: "Client is required" }),
  clientName: z.string().min(1, { message: "Client name is required" }),
  deviceType: z.string().min(1, { message: "Device type is required" }),
  deviceModel: z.string().min(1, { message: "Device model is required" }),
  issueType: z.string().min(1, { message: "Issue type is required" }),
  issueDescription: z.string().min(1, { message: "Issue description is required" }),
  priority: z.string().min(1, { message: "Priority is required" }),
  status: z.enum(["RECEIVED", "DIAGNOSED", "IN_PROGRESS", "COMPLETED", "READY"]).default("RECEIVED"),
  dueDate: z.string().min(1, { message: "Due date is required" }),
  technicianId: z.number().nullable().default(null),
});

export function TicketModal({
  isOpen,
  onClose,
  onSubmit,
  ticket,
}: TicketModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const form = useForm<z.infer<typeof ticketSchema>>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      clientId: ticket?.clientId || 0,
      clientName: ticket?.clientName || "",
      deviceType: ticket?.deviceType || "",
      deviceModel: ticket?.deviceModel || "",
      issueType: ticket?.issueType || "",
      issueDescription: ticket?.issueDescription || "",
      priority: ticket?.priority || "medium",
      status: ticket?.status || "RECEIVED",
      dueDate: ticket?.dueDate 
        ? new Date(ticket.dueDate).toISOString().substring(0, 10)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
      technicianId: ticket?.technicianId || null,
    },
  });
  
  const handleSubmit = (values: z.infer<typeof ticketSchema>) => {
    setIsSubmitting(true);
    onSubmit(values);
    setIsSubmitting(false);
  };
  
  const handleClientChange = (clientId: string) => {
    const selectedClient = clients?.find(client => client.id === parseInt(clientId));
    if (selectedClient) {
      form.setValue("clientName", selectedClient.name);
    } else {
      form.setValue("clientName", "");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary-100">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-lg font-medium leading-6">
            {ticket ? "Edit Ticket" : "Create New Ticket"}
          </DialogTitle>
          <DialogDescription className="text-center">
            Enter the details of the repair ticket below.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(parseInt(value));
                      handleClientChange(value);
                    }}
                    defaultValue={field.value ? field.value.toString() : undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients?.map((client) => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          {client.name}
                        </SelectItem>
                      )) || (
                        <SelectItem value="0" disabled>
                          No clients available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deviceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Device Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select device type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {deviceTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deviceModel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Device Model</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g. iPhone 12 Pro, Samsung S21"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="issueType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issue Type</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g. Screen, Battery, Charging Port"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="issueDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issue Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Describe the issue..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {priorities.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel>Attachments</FormLabel>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-neutral-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <svg className="mx-auto h-12 w-12 text-neutral-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                  <div className="flex text-sm text-neutral-600 justify-center">
                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary">
                      <span>Upload a file</span>
                      <input type="file" className="sr-only" />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-neutral-500">
                    PNG, JPG, PDF up to 10MB
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense mt-6">
              <Button
                type="submit"
                className="sm:col-start-2"
                disabled={isSubmitting}
              >
                {ticket ? "Update Ticket" : "Create Ticket"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="mt-3 sm:mt-0 sm:col-start-1"
                onClick={onClose}
              >
                Cancel
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
