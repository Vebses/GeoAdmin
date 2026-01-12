'use client';

import { useState } from 'react';
import { Settings, Bell, Mail, AlertTriangle, Loader2, Save } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  
  // General settings state
  const [generalSettings, setGeneralSettings] = useState({
    organizationName: 'GeoAdmin',
    timezone: 'Asia/Tbilisi',
    dateFormat: 'DD/MM/YYYY',
    defaultCurrency: 'EUR',
  });

  // Invoice settings state
  const [invoiceSettings, setInvoiceSettings] = useState({
    invoicePrefix: 'INV-',
    nextInvoiceNumber: 1001,
    paymentTermsDays: 30,
  });

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    newCaseAssigned: true,
    invoicePaid: true,
    dailySummary: false,
    soundEnabled: true,
  });

  // Email settings state
  const [emailSettings, setEmailSettings] = useState({
    senderName: 'GeoAdmin',
    replyToEmail: 'noreply@geoadmin.ge',
    invoiceEmailTemplate: 'გთხოვთ იხილოთ თანდართული ინვოისი. გადახდა შესაძლებელია მითითებულ საბანკო ანგარიშზე.',
  });

  const handleSaveGeneral = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    toast.success('ძირითადი პარამეტრები შენახულია');
    setIsSaving(false);
  };

  const handleSaveInvoice = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    toast.success('ინვოისის პარამეტრები შენახულია');
    setIsSaving(false);
  };

  const handleSaveNotifications = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    toast.success('შეტყობინებების პარამეტრები შენახულია');
    setIsSaving(false);
  };

  const handleSaveEmail = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    toast.success('ელ-ფოსტის პარამეტრები შენახულია');
    setIsSaving(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gray-100 rounded-lg">
          <Settings className="h-6 w-6 text-gray-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">პარამეტრები</h1>
          <p className="text-sm text-gray-500">სისტემის კონფიგურაცია</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 h-10">
          <TabsTrigger value="general" className="text-xs">
            <Settings className="h-3.5 w-3.5 mr-1.5" />
            ძირითადი
          </TabsTrigger>
          <TabsTrigger value="invoice" className="text-xs">
            <Mail className="h-3.5 w-3.5 mr-1.5" />
            ინვოისი
          </TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs">
            <Bell className="h-3.5 w-3.5 mr-1.5" />
            შეტყობინებები
          </TabsTrigger>
          <TabsTrigger value="danger" className="text-xs">
            <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
            საშიში
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
            <h3 className="text-sm font-semibold text-gray-900">ძირითადი პარამეტრები</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">ორგანიზაციის სახელი</Label>
                <Input 
                  value={generalSettings.organizationName}
                  onChange={(e) => setGeneralSettings(s => ({ ...s, organizationName: e.target.value }))}
                  className="h-9 text-sm" 
                />
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-xs">დროის ზონა</Label>
                <Input 
                  value={generalSettings.timezone}
                  className="h-9 text-sm" 
                  disabled 
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">თარიღის ფორმატი</Label>
                <Input 
                  value={generalSettings.dateFormat}
                  onChange={(e) => setGeneralSettings(s => ({ ...s, dateFormat: e.target.value }))}
                  className="h-9 text-sm" 
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">ნაგულისხმევი ვალუტა</Label>
                <Input 
                  value={generalSettings.defaultCurrency}
                  onChange={(e) => setGeneralSettings(s => ({ ...s, defaultCurrency: e.target.value }))}
                  className="h-9 text-sm" 
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={handleSaveGeneral} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
                შენახვა
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Invoice Settings */}
        <TabsContent value="invoice" className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
            <h3 className="text-sm font-semibold text-gray-900">ინვოისის პარამეტრები</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">ინვოისის პრეფიქსი</Label>
                <Input 
                  value={invoiceSettings.invoicePrefix}
                  onChange={(e) => setInvoiceSettings(s => ({ ...s, invoicePrefix: e.target.value }))}
                  className="h-9 text-sm" 
                />
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-xs">შემდეგი ნომერი</Label>
                <Input 
                  value={invoiceSettings.nextInvoiceNumber}
                  onChange={(e) => setInvoiceSettings(s => ({ ...s, nextInvoiceNumber: parseInt(e.target.value) || 0 }))}
                  type="number" 
                  className="h-9 text-sm" 
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">გადახდის ვადა (დღეები)</Label>
                <Input 
                  value={invoiceSettings.paymentTermsDays}
                  onChange={(e) => setInvoiceSettings(s => ({ ...s, paymentTermsDays: parseInt(e.target.value) || 0 }))}
                  type="number" 
                  className="h-9 text-sm" 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">ინვოისის თანმხლები ტექსტი</Label>
              <textarea 
                value={emailSettings.invoiceEmailTemplate}
                onChange={(e) => setEmailSettings(s => ({ ...s, invoiceEmailTemplate: e.target.value }))}
                className="w-full h-20 px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={handleSaveInvoice} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
                შენახვა
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
            <h3 className="text-sm font-semibold text-gray-900">შეტყობინებების პარამეტრები</h3>
            
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox 
                  checked={notificationSettings.newCaseAssigned}
                  onCheckedChange={(checked) => setNotificationSettings(s => ({ ...s, newCaseAssigned: !!checked }))}
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">ახალი ქეისის შეტყობინება</span>
                  <p className="text-xs text-gray-500">მიიღეთ შეტყობინება ახალი ქეისის მინიჭებისას</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox 
                  checked={notificationSettings.invoicePaid}
                  onCheckedChange={(checked) => setNotificationSettings(s => ({ ...s, invoicePaid: !!checked }))}
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">ინვოისის გადახდის შეტყობინება</span>
                  <p className="text-xs text-gray-500">მიიღეთ შეტყობინება ინვოისის გადახდისას</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox 
                  checked={notificationSettings.dailySummary}
                  onCheckedChange={(checked) => setNotificationSettings(s => ({ ...s, dailySummary: !!checked }))}
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">ყოველდღიური შეჯამება</span>
                  <p className="text-xs text-gray-500">მიიღეთ ყოველდღიური ანგარიში ელ-ფოსტაზე</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox 
                  checked={notificationSettings.soundEnabled}
                  onCheckedChange={(checked) => setNotificationSettings(s => ({ ...s, soundEnabled: !!checked }))}
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">ხმოვანი შეტყობინებები</span>
                  <p className="text-xs text-gray-500">ხმოვანი სიგნალი ახალ შეტყობინებაზე</p>
                </div>
              </label>
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={handleSaveNotifications} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
                შენახვა
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Danger Zone */}
        <TabsContent value="danger" className="space-y-4">
          <div className="bg-white rounded-xl border border-red-200 p-6 space-y-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-red-900">საშიში ზონა</h3>
                <p className="text-xs text-red-700 mt-1">
                  ეს მოქმედებები შეუქცევადია. გთხოვთ სიფრთხილით მოეკიდოთ.
                </p>
              </div>
            </div>
            
            <div className="border-t border-red-100 pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">ყველა მონაცემის წაშლა</p>
                  <p className="text-xs text-gray-500">სამუდამოდ წაიშლება ყველა ქეისი, ინვოისი და პარტნიორი</p>
                </div>
                <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50 hover:border-red-200">
                  მონაცემების წაშლა
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">ანგარიშის დეაქტივაცია</p>
                  <p className="text-xs text-gray-500">თქვენი ანგარიში დროებით გაითიშება</p>
                </div>
                <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50 hover:border-red-200">
                  დეაქტივაცია
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
