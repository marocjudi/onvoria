import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";

// Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

// Stripe setup
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Payment form component
function PaymentForm({ clientSecret, onSuccess }: { clientSecret: string, onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "/subscription",
      },
      redirect: "if_required",
    });

    if (submitError) {
      setError(submitError.message || t("subscription.payment_failed"));
      toast({
        title: t("subscription.payment_failed"),
        description: submitError.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: t("subscription.payment_success"),
        description: t("subscription.subscription_active"),
      });
      onSuccess();
    }

    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      {error && (
        <Alert variant="destructive">
          <AlertTitle>{t("subscription.payment_error")}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Button 
        type="submit" 
        className="w-full" 
        disabled={!stripe || isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("subscription.processing")}
          </>
        ) : (
          t("subscription.complete_subscription")
        )}
      </Button>
    </form>
  );
}

type SubscriptionPlan = {
  id: string;
  name: string;
  description: string;
  price: number;
  priceId: string;
  features: string[];
};

export default function SubscriptionPage() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Get available subscription plans
  const { 
    data: plans, 
    isLoading: isLoadingPlans 
  } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/subscription-plans"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/subscription-plans");
      return await res.json();
    },
  });

  // Mutation for creating a subscription
  const createSubscriptionMutation = useMutation({
    mutationFn: async (planId: string) => {
      const res = await apiRequest("POST", "/api/create-subscription", { planId });
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
      } else {
        // If no client secret, subscription is already set up
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        toast({
          title: t("subscription.success"),
          description: t("subscription.subscription_active"),
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: t("subscription.failed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation for canceling a subscription
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/cancel-subscription");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: t("subscription.canceled"),
        description: t("subscription.cancel_success"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("subscription.cancel_failed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation for updating a subscription
  const updateSubscriptionMutation = useMutation({
    mutationFn: async (planId: string) => {
      const res = await apiRequest("POST", "/api/update-subscription", { planId });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: t("subscription.updated"),
        description: t("subscription.update_success"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("subscription.update_failed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handleSubscribe = () => {
    if (!selectedPlan) return;
    createSubscriptionMutation.mutate(selectedPlan);
  };

  const handleCancelSubscription = () => {
    cancelSubscriptionMutation.mutate();
  };

  const handleUpdateSubscription = () => {
    if (!selectedPlan) return;
    updateSubscriptionMutation.mutate(selectedPlan);
  };

  const handlePaymentSuccess = () => {
    setClientSecret(null);
    queryClient.invalidateQueries({ queryKey: ["/api/user"] });
  };

  // If user is not set, redirect to auth page
  useEffect(() => {
    if (user === null) {
      navigate("/auth");
    }
  }, [user, navigate]);

  // UI rendered based on different states
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If there's a client secret, show the payment form
  if (clientSecret) {
    return (
      <div className="container mx-auto py-8 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>{t("subscription.complete_payment")}</CardTitle>
            <CardDescription>
              {t("subscription.enter_payment_details")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <PaymentForm clientSecret={clientSecret} onSuccess={handlePaymentSuccess} />
            </Elements>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">{t("subscription.title")}</h1>
      
      {/* Current subscription info */}
      {user.subscriptionTier && user.subscriptionTier !== "NONE" && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t("subscription.current_subscription")}</CardTitle>
            <CardDescription>
              {t("subscription.current_tier")}: {user.subscriptionTier}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Badge variant={user.subscriptionStatus === "ACTIVE" ? "default" : "destructive"}>
                {user.subscriptionStatus}
              </Badge>
              {user.subscriptionCurrentPeriodEnd && (
                <span className="text-sm text-muted-foreground">
                  {t("subscription.renews_on")} {new Date(user.subscriptionCurrentPeriodEnd).toLocaleDateString()}
                </span>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="destructive" 
              onClick={handleCancelSubscription}
              disabled={cancelSubscriptionMutation.isPending}
            >
              {cancelSubscriptionMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {t("subscription.cancel")}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Plans comparison */}
      {isLoadingPlans ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {plans?.map((plan) => (
            <Card 
              key={plan.id} 
              className={`
                ${selectedPlan === plan.id ? 'ring-2 ring-primary' : ''} 
                ${user.subscriptionTier === plan.id ? 'bg-secondary/20' : ''}
              `}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription className="mt-1">{plan.description}</CardDescription>
                  </div>
                  {user.subscriptionTier === plan.id && (
                    <Badge variant="outline" className="ml-2">
                      {t("subscription.current")}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground ml-1">{t("subscription.per_month")}</span>
                </div>
                <Separator className="mb-4" />
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                {user.subscriptionTier === plan.id ? (
                  <Button disabled variant="outline" className="w-full">
                    {t("subscription.current_plan")}
                  </Button>
                ) : (
                  <Button
                    variant={selectedPlan === plan.id ? "default" : "outline"}
                    className="w-full"
                    onClick={() => handleSelectPlan(plan.id)}
                  >
                    {selectedPlan === plan.id ? t("subscription.selected") : t("subscription.select")}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Action buttons */}
      {selectedPlan && (
        <div className="mt-8 flex justify-center">
          {user.subscriptionTier === "NONE" ? (
            <Button
              size="lg"
              onClick={handleSubscribe}
              disabled={createSubscriptionMutation.isPending}
            >
              {createSubscriptionMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t("subscription.subscribe_now")}
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={handleUpdateSubscription}
              disabled={updateSubscriptionMutation.isPending || selectedPlan === user.subscriptionTier}
            >
              {updateSubscriptionMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {selectedPlan === user.subscriptionTier 
                ? t("subscription.current_plan") 
                : t("subscription.change_plan")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}