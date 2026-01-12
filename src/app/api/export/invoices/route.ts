import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/export/invoices - Export invoices as CSV or JSON
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const status = searchParams.get('status');
    
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    // Build query - simpler without relations
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase.from('invoices') as any)
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: invoices, error } = await query;

    if (error) {
      console.error('Export invoices error:', error);
      return NextResponse.json(
        { success: false, error: { code: 'EXPORT_FAILED', message: error.message } },
        { status: 500 }
      );
    }

    if (!invoices || invoices.length === 0) {
      if (format === 'json') {
        return NextResponse.json({ success: true, data: [] });
      }
      return new NextResponse('No data to export', { status: 204 });
    }

    // Fetch related data
    const caseIds = Array.from(new Set(invoices.map((i: { case_id: string }) => i.case_id).filter(Boolean)));
    const senderIds = Array.from(new Set(invoices.map((i: { sender_id: string }) => i.sender_id).filter(Boolean)));
    const recipientIds = Array.from(new Set(invoices.map((i: { recipient_id: string }) => i.recipient_id).filter(Boolean)));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: cases } = caseIds.length > 0
      ? await (supabase.from('cases') as any).select('id, case_number, patient_name').in('id', caseIds)
      : { data: [] };
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: senders } = senderIds.length > 0
      ? await (supabase.from('our_companies') as any).select('id, name').in('id', senderIds)
      : { data: [] };
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: recipients } = recipientIds.length > 0
      ? await (supabase.from('partners') as any).select('id, name').in('id', recipientIds)
      : { data: [] };

    // Create lookup maps
    type CaseInfo = { id: string; case_number: string; patient_name: string };
    const caseMap = new Map<string, CaseInfo>((cases || []).map((c: CaseInfo) => [c.id, c]));
    const senderMap = new Map((senders || []).map((s: { id: string; name: string }) => [s.id, s.name]));
    const recipientMap = new Map((recipients || []).map((r: { id: string; name: string }) => [r.id, r.name]));

    // Transform data for export
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const exportData = invoices.map((inv: any) => {
      const caseData = caseMap.get(inv.case_id);
      return {
        'ინვოისის ნომერი': inv.invoice_number || '',
        'სტატუსი': inv.status || '',
        'ქეისი': caseData?.case_number || '',
        'პაციენტი': caseData?.patient_name || '',
        'გამგზავნი': senderMap.get(inv.sender_id) || '',
        'მიმღები': recipientMap.get(inv.recipient_id) || '',
        'ვალუტა': inv.currency || '',
        'ჯამი': inv.subtotal?.toFixed(2) || '0.00',
        'სულ': inv.total?.toFixed(2) || '0.00',
        'გაგზავნის თარიღი': inv.sent_at ? new Date(inv.sent_at).toLocaleDateString('ka-GE') : '',
        'გადახდის თარიღი': inv.paid_at ? new Date(inv.paid_at).toLocaleDateString('ka-GE') : '',
        'შექმნის თარიღი': inv.created_at ? new Date(inv.created_at).toLocaleString('ka-GE') : '',
      };
    });

    if (format === 'json') {
      return NextResponse.json({ success: true, data: exportData });
    }

    // Generate CSV
    const headers = Object.keys(exportData[0]);
    const csvRows = [
      headers.join(','),
      ...exportData.map((row: Record<string, string>) => 
        headers.map(h => {
          const val = String(row[h] || '');
          if (val.includes(',') || val.includes('"') || val.includes('\n')) {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        }).join(',')
      ),
    ];
    const csvContent = '\uFEFF' + csvRows.join('\n'); // BOM for Excel UTF-8

    const filename = `invoices_${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export invoices error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: String(error) } },
      { status: 500 }
    );
  }
}
