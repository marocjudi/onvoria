import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Ticket, TicketStatus } from "@shared/schema";
import { Pagination } from "@/components/ui/pagination";
import { TicketModal } from "@/components/tickets/ticket-modal";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PlusIcon } from "lucide-react";

const ticketStatusStyles: Record<
  TicketStatus,
  { bg: string; text: string; label: string }
> = {
  RECEIVED: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    label: "Received",
  },
  DIAGNOSED: {
    bg: "bg-red-100",
    text: "text-red-800",
    label: "Diagnosed",
  },
  IN_PROGRESS: {
    bg: "bg-amber-100",
    text: "text-amber-800",
    label: "In Progress",
  },
  COMPLETED: {
    bg: "bg-secondary-100",
    text: "text-secondary-800",
    label: "Completed",
  },
  READY: {
    bg: "bg-green-100",
    text: "text-green-800",
    label: "Ready",
  },
};

export function TicketList() {
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const itemsPerPage = 5;
  const { toast } = useToast();

  const {
    data: tickets,
    isLoading,
    isError,
  } = useQuery<Ticket[]>({
    queryKey: ["/api/tickets"],
  });

  const createTicketMutation = useMutation({
    mutationFn: async (newTicket: Omit<Ticket, "id" | "statusHistory">) => {
      const res = await apiRequest("POST", "/api/tickets", newTicket);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      toast({
        title: "Success",
        description: "Ticket created successfully",
      });
      setIsModalOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create ticket: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleCreateTicket = (newTicket: Omit<Ticket, "id" | "statusHistory">) => {
    createTicketMutation.mutate(newTicket);
  };

  const paginatedTickets = tickets
    ? tickets.slice((page - 1) * itemsPerPage, page * itemsPerPage)
    : [];

  return (
    <>
      <Card>
        <CardHeader className="px-4 py-5 sm:px-6 flex justify-between items-center flex-wrap gap-4">
          <div>
            <h3 className="text-lg leading-6 font-medium text-neutral-900">
              Recent Tickets
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-neutral-500">
              Latest repair service tickets
            </p>
          </div>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center"
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            New Ticket
          </Button>
        </CardHeader>

        <CardContent className="border-t border-neutral-200 px-0 py-0">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-[120px]" />
                  <Skeleton className="h-4 w-[150px]" />
                  <Skeleton className="h-4 w-[80px]" />
                  <Skeleton className="h-4 w-[80px]" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="p-8 text-center">
              <p className="text-red-500">
                Failed to load tickets. Please try again.
              </p>
            </div>
          ) : tickets?.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-neutral-500">No tickets found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                    >
                      ID
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                    >
                      Client
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                    >
                      Device
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                    >
                      Due
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {paginatedTickets.map((ticket) => {
                    const statusStyle = ticketStatusStyles[ticket.status];
                    
                    return (
                      <tr key={ticket.id} className="hover:bg-neutral-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-600">
                          #{ticket.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                          {ticket.clientName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                          {ticket.deviceModel} - {ticket.issueType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyle.bg} ${statusStyle.text}`}
                          >
                            {statusStyle.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                          {new Date(ticket.dueDate).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>

        <CardFooter className="border-t border-neutral-200 px-4 py-4 sm:px-6">
          {tickets && tickets.length > 0 && (
            <Pagination
              className="w-full"
              count={Math.ceil(tickets.length / itemsPerPage)}
              page={page}
              onPageChange={setPage}
            />
          )}
        </CardFooter>
      </Card>

      <TicketModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateTicket}
      />
    </>
  );
}
