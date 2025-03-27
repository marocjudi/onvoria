import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { Sidebar } from "@/components/ui/sidebar";
import { Header } from "@/components/ui/header";
import { useMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Invoice } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { AlertTriangle, Check, CreditCard } from "lucide-react";

// Make sure to load Stripe outside of component render
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error("Missing Stripe public key");
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutForm = ({ amount, invoiceId }: { amount: number; invoiceId: number }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't loaded yet
      return;
    }

    setIsProcessing(true);
    setPaymentStatus("processing");

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + "/payments",
        },
        redirect: "if_required",
      });

      if (error) {
        setErrorMessage(error.message || "Payment failed. Please try again.");
        setPaymentStatus("error");
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        // Payment succeeded
        setPaymentStatus("success");
        toast({
          title: "Payment Successful",
          description: "Your payment has been processed successfully",
        });
        // Redirect after a delay
        setTimeout(() => navigate("/payments"), 2000);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred");
      setPaymentStatus("error");
      toast({
        title: "Payment Error",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <PaymentElement />
      
      {paymentStatus === "error" && (
        <div className="rounded-md bg-red-50 p-4 text-red-700 flex items-start">
          <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
          <div>
            <p className="font-medium">Payment failed</p>
            <p className="text-sm">{errorMessage}</p>
          </div>
        </div>
      )}
      
      {paymentStatus === "success" && (
        <div className="rounded-md bg-green-50 p-4 text-green-700 flex items-start">
          <Check className="h-5 w-5 mr-2 flex-shrink-0" />
          <div>
            <p className="font-medium">Payment successful!</p>
            <p className="text-sm">Your payment has been processed.</p>
          </div>
        </div>
      )}
      
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing || paymentStatus === "success"}
        className="w-full"
      >
        {isProcessing ? "Processing..." : `Pay $${(amount / 100).toFixed(2)}`}
      </Button>
    </form>
  );
};

export default function CheckoutPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useMobile();
  const { user } = useAuth();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [, params] = useRoute<{ invoiceId: string }>("/checkout/:invoiceId");
  const { toast } = useToast();

  const invoiceId = params?.invoiceId ? parseInt(params.invoiceId) : null;

  // Get invoice data
  const { data: invoice, isLoading: isLoadingInvoice } = useQuery<Invoice>({
    queryKey: ["/api/invoices", invoiceId],
    queryFn: () => apiRequest("GET", `/api/invoices/${invoiceId}`).then(res => res.json()),
    enabled: !!invoiceId,
  });

  useEffect(() => {
    if (invoice && invoice.total > 0) {
      const fetchPaymentIntent = async () => {
        try {
          const response = await apiRequest("POST", "/api/create-payment-intent", {
            amount: invoice.total,
            invoiceId: invoice.id,
          });
          
          const data = await response.json();
          setClientSecret(data.clientSecret);
        } catch (err: any) {
          toast({
            title: "Error",
            description: "Could not initialize payment: " + (err.message || "Unknown error"),
            variant: "destructive",
          });
          console.error("Error creating payment intent:", err);
        }
      };
      
      fetchPaymentIntent();
    }
  }, [invoice, toast]);

  if (!invoiceId) {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid Checkout Request</CardTitle>
          </CardHeader>
          <CardContent>
            <p>No invoice was specified for checkout.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => window.history.back()}>Go Back</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-neutral-100 h-screen flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar className={`${isMobile && !sidebarOpen ? "hidden" : "md:block"} ${isMobile ? "absolute z-50 h-full" : ""}`} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-neutral-50">
          <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-neutral-800">Secure Checkout</h1>
              <p className="mt-1 text-sm text-neutral-600">
                Complete your payment securely with Stripe
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {/* Payment Form */}
              <Card className="md:col-span-3">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="mr-2 h-5 w-5" />
                    Payment Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingInvoice || !clientSecret ? (
                    <div className="py-8 text-center">
                      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p className="text-neutral-600">Initializing payment...</p>
                    </div>
                  ) : (
                    <Elements 
                      stripe={stripePromise} 
                      options={{ clientSecret }}
                    >
                      <CheckoutForm amount={invoice?.total || 0} invoiceId={invoice?.id || 0} />
                    </Elements>
                  )}
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoadingInvoice ? (
                    <div className="py-8 text-center">
                      <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p className="text-neutral-600">Loading invoice data...</p>
                    </div>
                  ) : invoice ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Invoice #:</span>
                        <span className="font-medium">{invoice.invoiceNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Client:</span>
                        <span className="font-medium">{invoice.clientName}</span>
                      </div>
                      <div className="border-t border-neutral-200 my-4"></div>
                      {invoice.items.map((item, index) => (
                        <div key={index} className="flex justify-between">
                          <span className="text-neutral-600">{item.description}</span>
                          <span className="font-medium">${(item.total / 100).toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="border-t border-neutral-200 my-4"></div>
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Subtotal:</span>
                        <span className="font-medium">${(invoice.subTotal / 100).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Tax:</span>
                        <span className="font-medium">${(invoice.tax / 100).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total:</span>
                        <span>${(invoice.total / 100).toFixed(2)}</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-red-500">Invoice not found</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}