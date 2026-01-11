'use client';

import { Mail, Paperclip, User, Users } from 'lucide-react';

interface EmailPreviewData {
  from?: { email: string; name: string };
  to: string;
  cc?: string[];
  subject: string;
  body: string;
  attachments?: Array<{ name: string; type: string }>;
}

interface InvoiceEmailPreviewProps {
  data: EmailPreviewData;
  className?: string;
}

export function InvoiceEmailPreview({ data, className }: InvoiceEmailPreviewProps) {
  return (
    <div className={className}>
      {/* Email Header */}
      <div className="space-y-2 p-3 bg-gray-50 rounded-t-lg border border-gray-200">
        {/* From */}
        {data.from && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400 w-12">From:</span>
            <span className="text-gray-700 font-medium">
              {data.from.name} &lt;{data.from.email}&gt;
            </span>
          </div>
        )}
        
        {/* To */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-400 w-12">To:</span>
          <div className="flex items-center gap-1">
            <User className="h-3 w-3 text-gray-400" />
            <span className="text-gray-700">{data.to}</span>
          </div>
        </div>
        
        {/* CC */}
        {data.cc && data.cc.length > 0 && (
          <div className="flex items-start gap-2 text-xs">
            <span className="text-gray-400 w-12">CC:</span>
            <div className="flex items-center gap-1 flex-wrap">
              <Users className="h-3 w-3 text-gray-400" />
              {data.cc.map((email, i) => (
                <span key={i} className="text-gray-600">
                  {email}{i < data.cc!.length - 1 ? ',' : ''}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Subject */}
        <div className="flex items-center gap-2 text-xs pt-1 border-t border-gray-200">
          <span className="text-gray-400 w-12">Subject:</span>
          <span className="text-gray-900 font-medium">{data.subject}</span>
        </div>
      </div>
      
      {/* Email Body */}
      <div className="p-3 border-x border-gray-200 bg-white min-h-[150px]">
        <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
          {data.body}
        </pre>
      </div>
      
      {/* Attachments */}
      {data.attachments && data.attachments.length > 0 && (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-b-lg">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
            <Paperclip className="h-3 w-3" />
            <span>Attachments ({data.attachments.length})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.attachments.map((attachment, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-700"
              >
                {attachment.type === 'application/pdf' ? (
                  <span className="text-red-500">PDF</span>
                ) : attachment.type === 'folder' ? (
                  <span className="text-blue-500">📁</span>
                ) : (
                  <span className="text-gray-400">📎</span>
                )}
                <span>{attachment.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default InvoiceEmailPreview;
