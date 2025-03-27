import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, SendIcon } from "lucide-react";
import { format } from "date-fns";

type TicketComment = {
  id: number;
  content: string;
  userId: number;
  username: string;
  ticketId: number;
  createdAt: string;
};

interface TicketCommentsProps {
  ticketId: number;
}

export function TicketComments({ ticketId }: TicketCommentsProps) {
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when comments change
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [comments]);

  useEffect(() => {
    // Connect to WebSocket for real-time updates
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws?ticketId=${ticketId}`;
    
    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;
    
    socket.onopen = () => {
      console.log("WebSocket connection established");
    };
    
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === "INIT_COMMENTS") {
          setComments(data.data);
          setLoading(false);
        } else if (data.type === "NEW_COMMENT") {
          setComments(prev => [...prev, data.data]);
        }
      } catch (err) {
        console.error("Error parsing WebSocket message", err);
      }
    };
    
    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to comment stream. Please refresh the page.",
        variant: "destructive",
      });
      setLoading(false);
    };
    
    socket.onclose = () => {
      console.log("WebSocket connection closed");
    };
    
    // Fallback in case WebSocket fails
    fetchComments();
    
    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [ticketId]);
  
  const fetchComments = async () => {
    try {
      const response = await apiRequest("GET", `/api/tickets/${ticketId}/comments`);
      const data = await response.json();
      setComments(data);
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast({
        title: "Error",
        description: "Failed to load comments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;
    
    setSubmitting(true);
    
    try {
      await apiRequest("POST", `/api/tickets/${ticketId}/comments`, {
        content: newComment
      });
      
      // WebSocket will handle adding the comment to the UI
      setNewComment("");
    } catch (error) {
      console.error("Error submitting comment:", error);
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg">Comments</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ScrollArea ref={scrollAreaRef} className="h-[300px] pr-4">
            {comments.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">No comments yet</p>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div 
                    key={comment.id} 
                    className={`flex gap-3 ${
                      comment.userId === user?.id ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div 
                      className={`max-w-[80%] flex ${
                        comment.userId === user?.id ? "flex-row-reverse" : "flex-row"
                      }`}
                    >
                      <Avatar className="h-8 w-8 mt-1">
                        <AvatarFallback>
                          {comment.username.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`mx-2 ${
                        comment.userId === user?.id 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted"
                      } p-3 rounded-md`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {comment.username}
                          </span>
                          <span className="text-xs opacity-70">
                            {format(new Date(comment.createdAt), "MMM d, h:mm a")}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        )}
      </CardContent>
      <CardFooter>
        <form onSubmit={handleSubmit} className="flex gap-2 w-full">
          <Textarea
            placeholder="Type your comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px]"
            disabled={submitting}
          />
          <Button 
            type="submit" 
            disabled={!newComment.trim() || submitting}
            className="ml-2"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <SendIcon className="h-4 w-4" />
            )}
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}