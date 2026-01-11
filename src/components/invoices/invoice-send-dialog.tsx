'use client';

import { useState, useEffect } from 'react';
import { Send, Loader2, AlertCircle, Mail, Eye, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InvoiceEmailPreview } from './invoice-email-preview';
import { toast } from 'sonner';
import type { InvoiceWithRelations } from '@/types';

interface InvoiceSendDialogProps {
  invoice: InvoiceWithRelations;
  isOpen: boolean;
  onClose: () => void;
  onSent?: () => void;
}

export function InvoiceSendDialog({
  invoice,
  isOpen,
  onClose,
  onSent,
}: InvoiceSendDialogProps) {
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  
  // Form state
  const [email, setEmail] = useState('');
  const [ccEmails, setCcEmails] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  // Preview data
  const [previewData, setPreviewData] = useState<{
    from?: { email: string; name: string };
    to: string;
    cc?: string[];
    subject: string;
    body: string;
    attachments?: Array<{ name: string; type: string }>;
  } | null>(null);

  // Load preview data
  useEffect(() => {
    if (isOpen && invoice.id) {
      setPreviewLoading(true);
      fetch(`/api/invoices/${invoice.id}/preview`)
        .then((res) => res.json())
        .then((result) => {
          if (result.success && result.data) {
            setPreviewData(result.data);
            // Initialize form with default values
            setEmail(result.data.to || '');
            setCcEmails(result.data.cc?.join(', ') || '');
            setSubject(result.data.subject || '');
            setBody(result.data.body || '');
          }
        })
        .catch((err) => {
          console.error('Failed to load preview:', err);
        })
        .finally(() => {
          setPreviewLoading(false);
        });
    }
  }, [isOpen, invoice.id]);

  // Handle send
  const handleSend = async () => {
    if (!email.trim()) {
      toast.error('გთხოვთ შეიყვანოთ ადრესატის ელ-ფოსტა');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          cc_emails: ccEmails
            .split(/[,;]/)
            .map((e) => e.trim())
            .filter(Boolean),
          subject: subject.trim() || undefined,
          body: body.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'გაგზავნა ვერ მოხერხდა');
      }

      toast.success('ინვოისი გაიგზავნა');
      onSent?.();
      onClose();
    } catch (error) {
      console.error('Send error:', error);
      toast.error(error instanceof Error ? error.message : 'გაგზავნა ვერ მოხერხდა');
    } finally {
      setLoading(false);
    }
  };

  // Current preview data (with form overrides)
  const currentPreview = previewData
    ? {
        ...previewData,
        to: email || previewData.to,
        cc: ccEmails
          .split(/[,;]/)
          .map((e) => e.trim())
          .filter(Boolean),
        subject: subject || previewData.subject,
        body: body || previewData.body,
      }
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-blue-500" />
            ინვოისის გაგზავნა: {invoice.invoice_number}
          </DialogTitle>
        </DialogHeader>

        <Tabs 
          value={activeTab} 
          onValueChange={(v) => setActiveTab(v as 'edit' | 'preview')}
          className="flex-1 flex flex-col min-h-0"
        >
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="edit" className="text-xs">
              <Mail className="h-3.5 w-3.5 mr-1.5" />
              რედაქტირება
            </TabsTrigger>
            <TabsTrigger value="preview" className="text-xs">
              <Eye className="h-3.5 w-3.5 mr-1.5" />
              პრევიუ
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto min-h-0">
            <TabsContent value="edit" className="mt-0 space-y-4">
              {/* To */}
              <div className="space-y-1.5">
                <Label className="text-xs">ადრესატი *</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="h-9 text-sm"
                />
              </div>

              {/* CC */}
              <div className="space-y-1.5">
                <Label className="text-xs">CC (ასლი)</Label>
                <Input
                  value={ccEmails}
                  onChange={(e) => setCcEmails(e.target.value)}
                  placeholder="email1@example.com, email2@example.com"
                  className="h-9 text-sm"
                />
                <p className="text-[10px] text-gray-400">
                  გამოყავით მძიმით ან წერტილ-მძიმით
                </p>
              </div>

              {/* Subject */}
              <div className="space-y-1.5">
                <Label className="text-xs">თემა</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={previewData?.subject}
                  className="h-9 text-sm"
                />
              </div>

              {/* Body */}
              <div className="space-y-1.5">
                <Label className="text-xs">წერილის ტექსტი</Label>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={previewData?.body}
                  rows={10}
                  className="text-sm resize-none"
                />
              </div>

              {/* Attachments info */}
              {previewData?.attachments && previewData.attachments.length > 0 && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-2">
                    <FileText className="h-3.5 w-3.5" />
                    <span>დანართები ({previewData.attachments.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {previewData.attachments.map((att, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-white border rounded text-[10px] text-gray-600"
                      >
                        {att.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="preview" className="mt-0">
              {previewLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : currentPreview ? (
                <InvoiceEmailPreview data={currentPreview} />
              ) : (
                <div className="flex items-center justify-center py-12 text-gray-400">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  პრევიუ ვერ ჩაიტვირთა
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="mt-4 pt-4 border-t">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            გაუქმება
          </Button>
          <Button type="button" onClick={handleSend} disabled={loading || !email.trim()}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                იგზავნება...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-1.5" />
                გაგზავნა
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default InvoiceSendDialog;
