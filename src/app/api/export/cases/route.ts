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

    // Build query - simpler without relations to avoid type issues
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase.from('cases') as any)
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: cases, error } = await query;

    if (error) {
      console.error('Export cases error:', error);
      return NextResponse.json(
        { success: false, error: { code: 'EXPORT_FAILED', message: error.message } },
        { status: 500 }
      );
    }

    if (!cases || cases.length === 0) {
      if (format === 'json') {
        return NextResponse.json({ success: true, data: [] });
      }
      return new NextResponse('No data to export', { status: 204 });
    }

    // Fetch related data separately
    const clientIds = Array.from(new Set(cases.map((c: { client_id: string }) => c.client_id).filter(Boolean)));
    const insuranceIds = Array.from(new Set(cases.map((c: { insurance_id: string }) => c.insurance_id).filter(Boolean)));
    const assigneeIds = Array.from(new Set(cases.map((c: { assigned_to: string }) => c.assigned_to).filter(Boolean)));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: clients } = clientIds.length > 0 
      ? await (supabase.from('partners') as any).select('id, name').in('id', clientIds)
      : { data: [] };
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: insurances } = insuranceIds.length > 0
      ? await (supabase.from('partners') as any).select('id, name').in('id', insuranceIds)
      : { data: [] };
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: users } = assigneeIds.length > 0
      ? await (supabase.from('users') as any).select('id, full_name').in('id', assigneeIds)
      : { data: [] };

    // Create lookup maps
    const clientMap = new Map((clients || []).map((c: { id: string; name: string }) => [c.id, c.name]));
    const insuranceMap = new Map((insurances || []).map((i: { id: string; name: string }) => [i.id, i.name]));
    const userMap = new Map((users || []).map((u: { id: string; full_name: string }) => [u.id, u.full_name]));

    // Transform data for export
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const exportData = cases.map((c: any) => ({
      'ქეისის ნომერი': c.case_number || '',
      'სტატუსი': c.status || '',
      'პაციენტი': c.patient_name || '',
      'პაციენტის ID': c.patient_id || '',
      'დაბადების თარიღი': c.patient_birth_date || '',
      'კლიენტი': clientMap.get(c.client_id) || '',
      'დაზღვევა': insuranceMap.get(c.insurance_id) || '',
      'პასუხისმგებელი': userMap.get(c.assigned_to) || '',
      'სამედიცინო': c.is_medical ? 'დიახ' : 'არა',
      'დოკუმენტირებული': c.is_documented ? 'დიახ' : 'არა',
      'გახსნის თარიღი': c.opened_at ? new Date(c.opened_at).toLocaleDateString('ka-GE') : '',
      'დახურვის თარიღი': c.closed_at ? new Date(c.closed_at).toLocaleDateString('ka-GE') : '',
      'მომსახურების ღირებულება': c.total_service_cost?.toFixed(2) || '0.00',
      'ასისტანსის ღირებულება': c.total_assistance_cost?.toFixed(2) || '0.00',
      'შექმნის თარიღი': c.created_at ? new Date(c.created_at).toLocaleString('ka-GE') : '',
    }));

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
      { success: false, error: { code: 'SERVER_ERROR', message: String(error) } },
      { status: 500 }
    );
  }
}
