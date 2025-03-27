import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { TicketModal } from "@/components/tickets/ticket-modal";
import { Plus, FileText, Users, CreditCard } from "lucide-react";
import { Link } from "wouter";

export function QuickActionPanel() {
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  const actions = [
    {
      name: "New Ticket",
      icon: Plus,
      color: "bg-primary text-white hover:bg-primary/90",
      onClick: () => setIsTicketModalOpen(true),
    },
    {
      name: "New Invoice",
      icon: FileText,
      color: "bg-secondary text-white hover:bg-secondary/90",
      href: "/invoices/new",
    },
    {
      name: "Add Client",
      icon: Users,
      color: "bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50",
      href: "/clients/new",
    },
    {
      name: "Payment",
      icon: CreditCard,
      color: "bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50",
      href: "/payments/new",
    },
  ];

  return (
    <>
      <Card className="col-span-1">
        <CardHeader className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-neutral-900">Quick Actions</h3>
          <p className="mt-1 max-w-2xl text-sm text-neutral-500">
            Frequently used operations
          </p>
        </CardHeader>
        <CardContent className="border-t border-neutral-200 px-4 py-5">
          <div className="grid grid-cols-2 gap-4">
            {actions.map((action) => (
              action.href ? (
                <Link href={action.href} key={action.name}>
                  <Button
                    className={`inline-flex flex-col items-center justify-center w-full h-auto px-4 py-4 ${action.color}`}
                  >
                    <action.icon className="h-6 w-6 mb-2" />
                    {action.name}
                  </Button>
                </Link>
              ) : (
                <Button
                  key={action.name}
                  className={`inline-flex flex-col items-center justify-center px-4 py-4 ${action.color}`}
                  onClick={action.onClick}
                >
                  <action.icon className="h-6 w-6 mb-2" />
                  {action.name}
                </Button>
              )
            ))}
          </div>
        </CardContent>
      </Card>

      <TicketModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        onSubmit={(ticketData) => {
          // This will be handled by the parent component
          setIsTicketModalOpen(false);
        }}
      />
    </>
  );
}
