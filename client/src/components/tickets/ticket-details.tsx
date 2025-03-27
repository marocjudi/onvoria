import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { TicketComments } from "@/components/tickets/ticket-comments";
import { Ticket, TicketStatus } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { 
  CalendarIcon, 
  ClockIcon, 
  Smartphone as DeviceIcon,
  ShieldIcon,
  TagIcon,
  UserIcon,
  XCircleIcon
} from "lucide-react";

const ticketStatusColors: Record<TicketStatus, string> = {
  RECEIVED: "bg-blue-100 text-blue-800 hover:bg-blue-200",
  DIAGNOSED: "bg-red-100 text-red-800 hover:bg-red-200",
  IN_PROGRESS: "bg-amber-100 text-amber-800 hover:bg-amber-200",
  COMPLETED: "bg-secondary-100 text-secondary-800 hover:bg-secondary-200",
  READY: "bg-green-100 text-green-800 hover:bg-green-200",
};

const ticketStatusLabels: Record<TicketStatus, string> = {
  RECEIVED: "Received",
  DIAGNOSED: "Diagnosed",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  READY: "Ready for Pickup",
};

interface TicketDetailsProps {
  ticketId: number;
  onClose: () => void;
}

export function TicketDetails({ ticketId, onClose }: TicketDetailsProps) {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  
  const { data: ticket, isLoading, isError } = useQuery<Ticket>({
    queryKey: ["/api/tickets", ticketId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/tickets/${ticketId}`);
      return res.json();
    },
  });
  
  const updateStatusMutation = useMutation({
    mutationFn: async ({ status, note }: { status: TicketStatus; note: string }) => {
      const res = await apiRequest("PATCH", `/api/tickets/${ticketId}`, {
        status,
        statusHistory: [
          ...(ticket?.statusHistory || []),
          {
            status,
            timestamp: new Date().toISOString(),
            note,
          },
        ],
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", ticketId] });
      toast({
        title: "Status Updated",
        description: "The ticket status has been updated successfully",
      });
      setIsUpdating(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update status: ${error.message}`,
        variant: "destructive",
      });
      setIsUpdating(false);
    },
  });
  
  const handleStatusChange = (newStatus: TicketStatus) => {
    if (!ticket || ticket.status === newStatus) return;
    
    setIsUpdating(true);
    updateStatusMutation.mutate({
      status: newStatus,
      note: `Status changed to ${ticketStatusLabels[newStatus]}`,
    });
  };
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-8 w-[100px]" />
        </div>
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }
  
  if (isError || !ticket) {
    return (
      <div className="text-center py-8">
        <XCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-red-800">Error Loading Ticket</h3>
        <p className="mt-2 text-sm text-neutral-600">
          Failed to load ticket details. Please try again.
        </p>
        <Button onClick={onClose} className="mt-4" variant="outline">
          Go Back
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">
            Ticket #{ticket.id}
          </h2>
          <p className="text-neutral-500 mt-1">
            Created on {format(new Date(ticket.createdAt), "MMMM d, yyyy")}
          </p>
        </div>
        <Button onClick={onClose} variant="outline">
          Back to Tickets
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Ticket Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-neutral-500 mb-1 flex items-center">
                  <UserIcon className="h-4 w-4 mr-1 text-neutral-400" />
                  Client
                </h4>
                <p className="text-neutral-800">{ticket.clientName}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-neutral-500 mb-1 flex items-center">
                  <DeviceIcon className="h-4 w-4 mr-1 text-neutral-400" />
                  Device
                </h4>
                <p className="text-neutral-800">
                  {ticket.deviceType} - {ticket.deviceModel}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-neutral-500 mb-1 flex items-center">
                  <ShieldIcon className="h-4 w-4 mr-1 text-neutral-400" />
                  Issue Type
                </h4>
                <p className="text-neutral-800">{ticket.issueType}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-neutral-500 mb-1 flex items-center">
                  <TagIcon className="h-4 w-4 mr-1 text-neutral-400" />
                  Priority
                </h4>
                <p className="text-neutral-800">{ticket.priority}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-neutral-500 mb-1 flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1 text-neutral-400" />
                  Due Date
                </h4>
                <p className="text-neutral-800">
                  {format(new Date(ticket.dueDate), "MMMM d, yyyy")}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-neutral-500 mb-1 flex items-center">
                  <ClockIcon className="h-4 w-4 mr-1 text-neutral-400" />
                  Current Status
                </h4>
                <Badge className={`${ticketStatusColors[ticket.status]} mt-1`}>
                  {ticketStatusLabels[ticket.status]}
                </Badge>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-neutral-500 mb-2">
                Description
              </h4>
              <p className="text-neutral-800 whitespace-pre-wrap">
                {ticket.issueDescription}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-neutral-600">
                Update the ticket status based on repair progress
              </p>
              <div className="space-y-2">
                {(Object.keys(ticketStatusLabels) as TicketStatus[]).map((status) => (
                  <Button
                    key={status}
                    variant="outline"
                    size="sm"
                    className={`w-full justify-start ${
                      ticket.status === status
                        ? `${ticketStatusColors[status]} font-bold`
                        : ""
                    }`}
                    disabled={isUpdating || ticket.status === status}
                    onClick={() => handleStatusChange(status)}
                  >
                    {ticketStatusLabels[status]}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="mt-6">
              <h4 className="text-sm font-medium text-neutral-500 mb-2">
                Status History
              </h4>
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
                {(ticket.statusHistory || []).map((history, idx) => (
                  <div
                    key={idx}
                    className="border border-neutral-200 rounded p-2 text-sm"
                  >
                    <div className="flex justify-between items-start">
                      <Badge className={`${ticketStatusColors[history.status as TicketStatus]}`}>
                        {ticketStatusLabels[history.status as TicketStatus]}
                      </Badge>
                      <span className="text-xs text-neutral-500">
                        {format(new Date(history.timestamp), "MMM d, h:mm a")}
                      </span>
                    </div>
                    {history.note && (
                      <p className="mt-1 text-neutral-600">{history.note}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <TicketComments ticketId={ticket.id} />
    </div>
  );
}