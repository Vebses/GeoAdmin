import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/export/cases - Export cases as CSV or JSON
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
      .from('cases')
      .select(`
        id,
        case_number,
        status,
        patient_name,
        patient_id,
        patient_birth_date,
        is_medical,
        is_documented,
        opened_at,
        closed_at,
        total_service_cost,
        total_assistance_cost,
        created_at,
        client:partners!cases_client_id_fkey(name),
        insurance:partners!cases_insurance_id_fkey(name),
        assignee:users!cases_assigned_to_fkey(full_name)
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: cases, error } = await query;

    if (error) {
      console.error('Export cases error:', error);
      return NextResponse.json(
        { success: false, error: { code: 'EXPORT_FAILED', message: 'Failed to export cases' } },
        { status: 500 }
      );
    }

    // Transform data for export
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const exportData = (cases || []).map((c: any) => ({
      'Case Number': c.case_number,
      'Status': c.status,
      'Patient Name': c.patient_name,
      'Patient ID': c.patient_id || '',
      'Birth Date': c.patient_birth_date || '',
      'Client': c.client?.name || '',
      'Insurance': c.insurance?.name || '',
      'Assigned To': c.assignee?.full_name || '',
      'Medical': c.is_medical ? 'Yes' : 'No',
      'Documented': c.is_documented ? 'Yes' : 'No',
      'Opened': c.opened_at ? new Date(c.opened_at).toLocaleDateString() : '',
      'Closed': c.closed_at ? new Date(c.closed_at).toLocaleDateString() : '',
      'Service Cost (GEL)': c.total_service_cost?.toFixed(2) || '0.00',
      'Assistance Cost (EUR)': c.total_assistance_cost?.toFixed(2) || '0.00',
      'Created': new Date(c.created_at).toLocaleString(),
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
          // Escape quotes and wrap in quotes if contains comma
          if (val.includes(',') || val.includes('"') || val.includes('\n')) {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        }).join(',')
      ),
    ];
    const csvContent = csvRows.join('\n');

    const filename = `cases_${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export cases error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to export cases' } },
      { status: 500 }
    );
  }
}
