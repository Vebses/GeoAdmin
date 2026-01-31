'use client';

import { Send, CheckCircle, XCircle, Clock, Mail, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils/format';
import type { InvoiceSend } from '@/types';

interface InvoiceSendHistoryProps {
  sends: InvoiceSend[];
  className?: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  sent: { label: 'გაგზავნილი', color: 'bg-blue-100 text-blue-700', icon: Send },
  delivered: { label: 'მიღებული', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  bounced: { label: 'დაბრუნებული', color: 'bg-red-100 text-red-700', icon: XCircle },
  failed: { label: 'შეცდომა', color: 'bg-red-100 text-red-700', icon: XCircle },
  pending: { label: 'მიმდინარე', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
};

export function InvoiceSendHistory({ sends, className }: InvoiceSendHistoryProps) {
  if (!sends || sends.length === 0) {
    return (
      <div className={className}>
        <div className="text-center py-8 text-gray-400">
          <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">ჯერ არ გაგზავნილა</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-3">
        {sends.map((send) => {
          const config = statusConfig[send.status] || statusConfig.pending;
          const StatusIcon = config.icon;

          return (
            <div
              key={send.id}
              className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge className={`${config.color} text-[10px] px-1.5 py-0 h-5`}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {config.label}
                  </Badge>
                  {send.is_resend && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                      ხელახლა
                    </Badge>
                  )}
                </div>
                <span className="text-[10px] text-gray-400">
                  {formatDateTime((send as any).sent_at || send.created_at)}
                </span>
              </div>

              {/* Recipient */}
              <div className="flex items-center gap-1.5 text-xs text-gray-700 mb-1">
                <User className="h-3 w-3 text-gray-400" />
                <span className="font-medium">{send.email}</span>
              </div>

              {/* CC */}
              {send.cc_emails && send.cc_emails.length > 0 && (
                <div className="text-[10px] text-gray-500 mb-1">
                  CC: {send.cc_emails.join(', ')}
                </div>
              )}

              {/* Subject */}
              {send.subject && (
                <div className="text-xs text-gray-600 truncate">
                  <span className="text-gray-400">თემა:</span> {send.subject}
                </div>
              )}

              {/* Error message */}
              {send.error_message && (
                <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-600">
                  {send.error_message}
                </div>
              )}

              {/* Opened indicator */}
              {send.opened_at && (
                <div className="mt-2 pt-2 border-t border-gray-100 text-[10px] text-green-600">
                  გახსნილია: {formatDateTime(send.opened_at)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default InvoiceSendHistory;
