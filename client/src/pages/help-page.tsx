import { useState } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { Header } from "@/components/ui/header";
import { useMobile } from "@/hooks/use-mobile";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Search, LifeBuoy, FileQuestion, Mail, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Support form schema
const supportFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  subject: z.string().min(5, { message: "Subject must be at least 5 characters" }),
  message: z.string().min(10, { message: "Message must be at least 10 characters" }),
});

type SupportFormValues = z.infer<typeof supportFormSchema>;

export default function HelpPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useMobile();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  // Support form
  const form = useForm<SupportFormValues>({
    resolver: zodResolver(supportFormSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = (data: SupportFormValues) => {
    // In a real app, this would send the data to a backend API
    console.log("Support form submitted:", data);
    
    toast({
      title: "Support request submitted",
      description: "We'll get back to you as soon as possible.",
    });
    
    form.reset();
  };

  // FAQ data
  const faqItems = [
    {
      question: "How do I create a new repair ticket?",
      answer: "To create a new repair ticket, navigate to the Tickets page and click on the 'New Ticket' button in the top-right corner. Fill in the required information about the client, device, and issue, then click 'Create Ticket'."
    },
    {
      question: "How do I add a new client?",
      answer: "You can add a new client by going to the Clients page and clicking on the 'Add Client' button. Fill in the client's details such as name, contact information, and address, then click 'Save'."
    },
    {
      question: "How do I generate an invoice?",
      answer: "To generate an invoice, go to the Invoices page and click 'New Invoice'. Select a client and ticket (if applicable), add line items for services or parts, and click 'Create Invoice'. You can then print or email the invoice to the client."
    },
    {
      question: "How do I record a payment?",
      answer: "To record a payment, navigate to the Payments page and click 'Record Payment'. Select the invoice being paid, enter the payment amount and method, then click 'Save'. The payment will be linked to the invoice and the client's account."
    },
    {
      question: "Can I update a ticket's status?",
      answer: "Yes, you can update a ticket's status by opening the ticket details and clicking on the 'Update Status' button. Select the new status (e.g., Diagnosed, In Progress, Completed) and add any relevant notes."
    },
    {
      question: "How do I assign a technician to a ticket?",
      answer: "Open the ticket details and click on the 'Assign Technician' option. Select the technician from the dropdown list and click 'Assign'. The technician will be notified of the assignment."
    },
    {
      question: "How do I track repair progress?",
      answer: "You can track repair progress on the Dashboard, which shows active tickets and their current status. For more detailed information, open a specific ticket to view its complete history and status updates."
    },
    {
      question: "How do I customize my account settings?",
      answer: "Go to the Settings page to customize your account preferences. You can update your profile information, change notification settings, adjust language preferences, and modify the theme."
    }
  ];

  // Filter FAQ items based on search query
  const filteredFaqItems = searchQuery
    ? faqItems.filter(item => 
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqItems;

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
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-neutral-800">{t('help.title')}</h1>
              <p className="mt-1 text-sm text-neutral-600">
                {t('help.subtitle')}
              </p>
            </div>

            <Tabs defaultValue="faq" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="faq" className="flex items-center space-x-2">
                  <FileQuestion className="h-4 w-4" />
                  <span>{t('help.faq')}</span>
                </TabsTrigger>
                <TabsTrigger value="guides" className="flex items-center space-x-2">
                  <LifeBuoy className="h-4 w-4" />
                  <span>{t('help.userGuides')}</span>
                </TabsTrigger>
                <TabsTrigger value="contact" className="flex items-center space-x-2">
                  <MessageCircle className="h-4 w-4" />
                  <span>{t('help.contactSupport')}</span>
                </TabsTrigger>
              </TabsList>
              
              {/* FAQ Tab */}
              <TabsContent value="faq" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('help.frequentlyAskedQuestions')}</CardTitle>
                    <CardDescription>{t('help.findAnswers')}</CardDescription>
                    
                    <div className="relative mt-4">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
                      <Input
                        type="search"
                        placeholder={t('help.searchQuestions')}
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {filteredFaqItems.length > 0 ? (
                        filteredFaqItems.map((item, index) => (
                          <AccordionItem key={index} value={`item-${index}`}>
                            <AccordionTrigger>{item.question}</AccordionTrigger>
                            <AccordionContent>
                              {item.answer}
                            </AccordionContent>
                          </AccordionItem>
                        ))
                      ) : (
                        <div className="text-center py-6">
                          <p className="text-neutral-500">{t('help.noMatchingQuestions')}</p>
                          <p className="text-sm mt-2">{t('help.tryDifferentSearch')}</p>
                        </div>
                      )}
                    </Accordion>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* User Guides Tab */}
              <TabsContent value="guides" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('help.userGuides')}</CardTitle>
                    <CardDescription>{t('help.guidesDescription')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">{t('help.gettingStarted')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-neutral-600 mb-4">
                            {t('help.gettingStartedDesc')}
                          </p>
                          <Button variant="outline" className="w-full">{t('help.viewGuide')}</Button>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">{t('help.ticketManagement')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-neutral-600 mb-4">
                            {t('help.ticketManagementDesc')}
                          </p>
                          <Button variant="outline" className="w-full">{t('help.viewGuide')}</Button>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">{t('help.clientManagement')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-neutral-600 mb-4">
                            {t('help.clientManagementDesc')}
                          </p>
                          <Button variant="outline" className="w-full">{t('help.viewGuide')}</Button>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">{t('help.invoicingPayments')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-neutral-600 mb-4">
                            {t('help.invoicingPaymentsDesc')}
                          </p>
                          <Button variant="outline" className="w-full">{t('help.viewGuide')}</Button>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Contact Support Tab */}
              <TabsContent value="contact" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('help.contactSupport')}</CardTitle>
                    <CardDescription>
                      {t('help.contactSupportDesc')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t('help.form.name')}</FormLabel>
                                <FormControl>
                                  <Input placeholder={t('help.form.namePlaceholder')} {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t('help.form.email')}</FormLabel>
                                <FormControl>
                                  <Input placeholder={t('help.form.emailPlaceholder')} {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="subject"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('help.form.subject')}</FormLabel>
                              <FormControl>
                                <Input placeholder={t('help.form.subjectPlaceholder')} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="message"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('help.form.message')}</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder={t('help.form.messagePlaceholder')}
                                  className="min-h-[150px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="flex justify-end">
                          <Button type="submit" className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            {t('help.form.sendMessage')}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}