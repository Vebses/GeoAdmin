'use client';

import { useState } from 'react';
import { 
  Download, 
  Printer, 
  ZoomIn, 
  ZoomOut, 
  ExternalLink,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils/cn';

interface InvoicePDFPreviewProps {
  invoiceId: string;
  invoiceNumber: string;
  isOpen: boolean;
  onClose: () => void;
}

export function InvoicePDFPreview({
  invoiceId,
  invoiceNumber,
  isOpen,
  onClose,
}: InvoicePDFPreviewProps) {
  const [zoom, setZoom] = useState(100);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pdfUrl = `/api/invoices/${invoiceId}/pdf`;

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 50));
  };

  const handleDownload = () => {
    window.open(`${pdfUrl}?download=true`, '_blank');
  };

  const handlePrint = () => {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = pdfUrl;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    };
  };

  const handleOpenInNewTab = () => {
    window.open(pdfUrl, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-4 py-3 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-sm font-medium">
              PDF: {invoiceNumber}
            </DialogTitle>
            
            {/* Toolbar */}
            <div className="flex items-center gap-1">
              {/* Zoom controls */}
              <div className="flex items-center gap-1 mr-2 px-2 py-1 bg-gray-100 rounded-lg">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={handleZoomOut}
                  disabled={zoom <= 50}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-xs font-medium w-12 text-center">{zoom}%</span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={handleZoomIn}
                  disabled={zoom >= 200}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>

              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8"
                onClick={handleOpenInNewTab}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                გახსნა
              </Button>

              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8"
                onClick={handlePrint}
              >
                <Printer className="h-4 w-4 mr-1" />
                ბეჭდვა
              </Button>

              <Button
                type="button"
                size="sm"
                variant="default"
                className="h-8"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-1" />
                ჩამოტვირთვა
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-auto bg-gray-800 p-4">
          <div 
            className="mx-auto transition-transform duration-200 origin-top"
            style={{ 
              transform: `scale(${zoom / 100})`,
              width: `${100 / (zoom / 100)}%`,
            }}
          >
            {loading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            )}
            
            {error && (
              <div className="flex items-center justify-center py-20">
                <div className="text-center text-white">
                  <p className="text-red-400 mb-2">PDF ჩატვირთვა ვერ მოხერხდა</p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setError(null);
                      setLoading(true);
                    }}
                  >
                    ხელახლა ცდა
                  </Button>
                </div>
              </div>
            )}

            <iframe
              src={pdfUrl}
              className={cn(
                'w-full bg-white shadow-2xl',
                loading ? 'invisible h-0' : 'visible'
              )}
              style={{ 
                minHeight: loading ? 0 : '842px',
                aspectRatio: '1/1.414', // A4 ratio
              }}
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setError('PDF ჩატვირთვა ვერ მოხერხდა');
              }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default InvoicePDFPreview;
