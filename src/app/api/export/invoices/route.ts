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

    // Build query
    let query = supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        status,
        currency,
        subtotal,
        total,
        sent_at,
        paid_at,
        created_at,
        case:cases(case_number, patient_name),
        sender:our_companies(name),
        recipient:partners(name)
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: invoices, error } = await query;

    if (error) {
      console.error('Export invoices error:', error);
      return NextResponse.json(
        { success: false, error: { code: 'EXPORT_FAILED', message: 'Failed to export invoices' } },
        { status: 500 }
      );
    }

    // Transform data for export
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const exportData = (invoices || []).map((inv: any) => ({
      'Invoice Number': inv.invoice_number,
      'Status': inv.status,
      'Case': inv.case?.case_number || '',
      'Patient': inv.case?.patient_name || '',
      'From': inv.sender?.name || '',
      'To': inv.recipient?.name || '',
      'Currency': inv.currency,
      'Subtotal': inv.subtotal?.toFixed(2) || '0.00',
      'Total': inv.total?.toFixed(2) || '0.00',
      'Sent': inv.sent_at ? new Date(inv.sent_at).toLocaleDateString() : '',
      'Paid': inv.paid_at ? new Date(inv.paid_at).toLocaleDateString() : '',
      'Created': new Date(inv.created_at).toLocaleString(),
    }));

    if (format === 'json') {
      return NextResponse.json({ success: true, data: exportData });
    }

    // Generate CSV
    if (exportData.length === 0) {
      return new NextResponse('No data to export', { status: 204 });
    }

    const headers = Object.keys(exportData[0]);
    const csvRows = [
      headers.join(','),
      ...exportData.map(row => 
        headers.map(h => {
          const val = String(row[h as keyof typeof row] || '');
          if (val.includes(',') || val.includes('"') || val.includes('\n')) {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        }).join(',')
      ),
    ];
    const csvContent = csvRows.join('\n');

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
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to export invoices' } },
      { status: 500 }
    );
  }
}
