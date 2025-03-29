import { useState } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { Header } from "@/components/ui/header";
import { useMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { User, Building, Bell, Shield, CreditCard, Globe, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function SettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useMobile();
  const { user, logoutMutation } = useAuth();
  const { t, i18n } = useTranslation();

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
              <h1 className="text-2xl font-semibold text-neutral-800">Settings</h1>
              <p className="mt-1 text-sm text-neutral-600">
                Manage your account and application preferences
              </p>
            </div>

            <Tabs defaultValue="profile" className="space-y-4">
              <TabsList className="bg-white p-1 rounded-md border border-neutral-200">
                <TabsTrigger value="profile" className="data-[state=active]:bg-primary/10">
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </TabsTrigger>
                <TabsTrigger value="company" className="data-[state=active]:bg-primary/10">
                  <Building className="h-4 w-4 mr-2" />
                  Company
                </TabsTrigger>
                <TabsTrigger value="notifications" className="data-[state=active]:bg-primary/10">
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger value="security" className="data-[state=active]:bg-primary/10">
                  <Shield className="h-4 w-4 mr-2" />
                  Security
                </TabsTrigger>
                <TabsTrigger value="billing" className="data-[state=active]:bg-primary/10">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Billing
                </TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-medium">Profile Information</h3>
                    <p className="text-sm text-neutral-500">
                      Update your personal information
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1 space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input id="username" defaultValue={user?.username} />
                      </div>
                      <div className="flex-1 space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="your@email.com" />
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1 space-y-2">
                        <Label htmlFor="first-name">First name</Label>
                        <Input id="first-name" placeholder="John" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <Label htmlFor="last-name">Last name</Label>
                        <Input id="last-name" placeholder="Doe" />
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1 space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" placeholder="(123) 456-7890" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Input id="role" defaultValue="Administrator" disabled />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline">Cancel</Button>
                    <Button>Save Changes</Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              {/* Company Tab */}
              <TabsContent value="company">
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-medium">Company Details</h3>
                    <p className="text-sm text-neutral-500">
                      Update your company information
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="company-name">Company Name</Label>
                      <Input id="company-name" placeholder="Acme Repairs" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company-address">Address</Label>
                      <Input id="company-address" placeholder="123 Main St" />
                    </div>
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1 space-y-2">
                        <Label htmlFor="company-city">City</Label>
                        <Input id="company-city" placeholder="New York" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <Label htmlFor="company-state">State</Label>
                        <Input id="company-state" placeholder="NY" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <Label htmlFor="company-zip">Zip</Label>
                        <Input id="company-zip" placeholder="10001" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company-website">Website</Label>
                      <Input id="company-website" placeholder="https://yourcompany.com" />
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline">Cancel</Button>
                    <Button>Save Changes</Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              {/* Notifications Tab */}
              <TabsContent value="notifications">
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-medium">Notification Preferences</h3>
                    <p className="text-sm text-neutral-500">
                      Manage how you receive notifications
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <h4 className="font-medium">Email Notifications</h4>
                      <Separator />
                      <div className="space-y-2">
                        {[
                          "New tickets",
                          "Ticket status updates",
                          "Payment received",
                          "Invoice created",
                          "Daily summary"
                        ].map((item) => (
                          <div key={item} className="flex items-center justify-between">
                            <Label htmlFor={`email-${item.toLowerCase().replace(/\s/g, '-')}`}>{item}</Label>
                            <Switch id={`email-${item.toLowerCase().replace(/\s/g, '-')}`} defaultChecked={true} />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-medium">SMS Notifications</h4>
                      <Separator />
                      <div className="space-y-2">
                        {[
                          "Urgent tickets",
                          "Payment confirmation"
                        ].map((item) => (
                          <div key={item} className="flex items-center justify-between">
                            <Label htmlFor={`sms-${item.toLowerCase().replace(/\s/g, '-')}`}>{item}</Label>
                            <Switch id={`sms-${item.toLowerCase().replace(/\s/g, '-')}`} defaultChecked={item === "Urgent tickets"} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline">Cancel</Button>
                    <Button>Save Changes</Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security">
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-medium">Security Settings</h3>
                    <p className="text-sm text-neutral-500">
                      Manage your account security
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <h4 className="font-medium">Change Password</h4>
                      <Separator />
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="current-password">Current Password</Label>
                          <Input id="current-password" type="password" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="new-password">New Password</Label>
                          <Input id="new-password" type="password" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirm-password">Confirm New Password</Label>
                          <Input id="confirm-password" type="password" />
                        </div>
                        <Button className="mt-2">Update Password</Button>
                      </div>
                    </div>
                    <div className="space-y-4 pt-4">
                      <h4 className="font-medium">Account Actions</h4>
                      <Separator />
                      <div className="space-y-4">
                        <Button
                          variant="destructive"
                          onClick={() => logoutMutation.mutate()}
                          disabled={logoutMutation.isPending}
                        >
                          {logoutMutation.isPending ? "Logging out..." : "Logout"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Billing Tab */}
              <TabsContent value="billing">
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-medium">Billing Settings</h3>
                    <p className="text-sm text-neutral-500">
                      Manage your subscription and payment methods
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <h4 className="font-medium">Current Plan</h4>
                      <Separator />
                      <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                        <div className="flex justify-between items-center mb-2">
                          <h5 className="font-medium text-primary">Professional Plan</h5>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-100 text-secondary-800">
                            Active
                          </span>
                        </div>
                        <p className="text-sm text-neutral-600 mb-4">Includes unlimited tickets, invoices, and client management</p>
                        <div className="flex justify-between items-center">
                          <span className="text-2xl font-bold">$29.99<span className="text-sm font-normal text-neutral-500">/month</span></span>
                          <Button variant="outline">Change Plan</Button>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-medium">Payment Methods</h4>
                      <Separator />
                      <div className="bg-white rounded-lg p-4 border border-neutral-200 flex justify-between items-center">
                        <div className="flex items-center">
                          <CreditCard className="h-6 w-6 mr-3 text-neutral-500" />
                          <div>
                            <p className="font-medium">•••• •••• •••• 4242</p>
                            <p className="text-sm text-neutral-500">Expires 12/25</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">Edit</Button>
                      </div>
                      <Button variant="outline" className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Payment Method
                      </Button>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-medium">Billing History</h4>
                      <Separator />
                      <div className="space-y-2">
                        {[
                          { date: "May 1, 2023", amount: "$29.99", status: "Paid" },
                          { date: "Apr 1, 2023", amount: "$29.99", status: "Paid" },
                          { date: "Mar 1, 2023", amount: "$29.99", status: "Paid" }
                        ].map((item, i) => (
                          <div key={i} className="flex justify-between py-2 border-b border-neutral-100 last:border-0">
                            <div>
                              <p className="font-medium">{item.date}</p>
                              <p className="text-sm text-neutral-500">Monthly subscription</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{item.amount}</p>
                              <p className="text-sm text-secondary-600">{item.status}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button variant="link" className="px-0">View all transactions</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Language Settings Card */}
            <div className="mt-6">
              <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                  <Globe className="h-6 w-6 text-primary" />
                  <div>
                    <h3 className="text-lg font-medium">{t('settings.language')}</h3>
                    <p className="text-sm text-neutral-500">
                      {t('settings.chooseYourPreferredLanguage')}
                    </p>
                  </div>
                </CardHeader>
                <CardContent>
                  <RadioGroup 
                    defaultValue={i18n.language}
                    onValueChange={(value) => i18n.changeLanguage(value)}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="en" id="language-en" />
                      <Label htmlFor="language-en">{t('settings.english')}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="fr" id="language-fr" />
                      <Label htmlFor="language-fr">{t('settings.french')}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="es" id="language-es" />
                      <Label htmlFor="language-es">{t('settings.spanish')}</Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
