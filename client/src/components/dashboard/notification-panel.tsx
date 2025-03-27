import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Notification } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export function NotificationPanel() {
  const { toast } = useToast();
  
  const {
    data: notifications,
    isLoading,
    isError,
  } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/notifications/mark-all-read", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to mark notifications as read: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const getTimeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)} years ago`;
    
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)} months ago`;
    
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)} days ago`;
    
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)} hours ago`;
    
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)} minutes ago`;
    
    return `${Math.floor(seconds)} seconds ago`;
  };

  const getNotificationTypeBadge = (type: string) => {
    switch (type) {
      case "NEW_TICKET":
        return <Badge className="bg-amber-100 text-amber-800">New</Badge>;
      case "PAYMENT":
        return <Badge className="bg-secondary-100 text-secondary-800">Payment</Badge>;
      case "STATUS_UPDATE":
        return <Badge className="bg-blue-100 text-blue-800">Status Update</Badge>;
      default:
        return <Badge>Info</Badge>;
    }
  };

  return (
    <Card className="col-span-2">
      <CardHeader className="px-4 py-5 sm:px-6 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h3 className="text-lg leading-6 font-medium text-neutral-900">
            Recent Notifications
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-neutral-500">
            Latest activity and updates
          </p>
        </div>
        <div>
          <Button
            variant="link"
            className="text-primary hover:text-primary-800 text-sm font-medium"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
          >
            Mark all as read
          </Button>
        </div>
      </CardHeader>

      <CardContent className="border-t border-neutral-200 px-0 py-0">
        {isLoading ? (
          <div className="space-y-6 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <div>
                  <Skeleton className="h-4 w-[300px] mb-2" />
                  <Skeleton className="h-3 w-[250px] mb-4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-[100px]" />
                    <Skeleton className="h-8 w-[80px]" />
                  </div>
                </div>
                <div className="text-right">
                  <Skeleton className="h-3 w-[80px] mb-2" />
                  <Skeleton className="h-6 w-[60px]" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="p-8 text-center">
            <p className="text-red-500">
              Failed to load notifications. Please try again.
            </p>
          </div>
        ) : notifications?.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-neutral-500">No notifications found.</p>
          </div>
        ) : (
          <ul role="list" className="divide-y divide-neutral-200">
            {notifications?.map((notification) => (
              <li key={notification.id} className="px-4 py-4 sm:px-6 hover:bg-neutral-50">
                <div className="flex items-start">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-neutral-900">
                      {notification.title}
                    </p>
                    <p className="text-sm text-neutral-500">
                      {notification.message}
                    </p>
                    <div className="mt-2 flex">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="bg-primary-100 text-primary-700 hover:bg-primary-200 text-xs px-2.5 py-1.5"
                      >
                        View details
                      </Button>
                      {notification.actionLabel && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="ml-3 text-neutral-700 bg-neutral-100 hover:bg-neutral-200 text-xs px-2.5 py-1.5"
                        >
                          {notification.actionLabel}
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0 text-right flex flex-col">
                    <span className="text-sm text-neutral-500">
                      {getTimeAgo(notification.createdAt)}
                    </span>
                    <span className="mt-1">
                      {getNotificationTypeBadge(notification.type)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <CardFooter className="border-t border-neutral-200 px-4 py-4 sm:px-6 justify-center">
        <Button variant="link" className="text-sm font-medium text-primary hover:text-primary-800">
          View all notifications
        </Button>
      </CardFooter>
    </Card>
  );
}
