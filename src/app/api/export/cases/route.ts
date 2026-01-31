import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/export/cases - Export cases with related data (actions, documents, invoices)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const status = searchParams.get('status');
    const openedFrom = searchParams.get('opened_from');
    const openedTo = searchParams.get('opened_to');
    const comprehensive = searchParams.get('comprehensive') === 'true';

    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    // Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase.from('cases') as any)
      .select('*')
      .is('deleted_at', null)
      .order('opened_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    // Date range filtering
    if (openedFrom) {
      query = query.gte('opened_at', openedFrom);
    }
    if (openedTo) {
      query = query.lte('opened_at', openedTo + 'T23:59:59');
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
        return NextResponse.json({
          success: true,
          data: comprehensive ? { cases: [], actions: [], documents: [], invoices: [] } : []
        });
      }
      return new NextResponse('No data to export', { status: 204 });
    }

    // Fetch related data separately
    const caseIds = cases.map((c: { id: string }) => c.id);
    const clientIds = Array.from(new Set(cases.map((c: { client_id: string }) => c.client_id).filter(Boolean)));
    const insuranceIds = Array.from(new Set(cases.map((c: { insurance_id: string }) => c.insurance_id).filter(Boolean)));
    const assigneeIds = Array.from(new Set(cases.map((c: { assigned_to: string }) => c.assigned_to).filter(Boolean)));
    const creatorIds = Array.from(new Set(cases.map((c: { created_by: string }) => c.created_by).filter(Boolean)));

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: creators } = creatorIds.length > 0
      ? await (supabase.from('users') as any).select('id, full_name').in('id', creatorIds)
      : { data: [] };

    // Create lookup maps
    const clientMap = new Map((clients || []).map((c: { id: string; name: string }) => [c.id, c.name]));
    const insuranceMap = new Map((insurances || []).map((i: { id: string; name: string }) => [i.id, i.name]));
    const userMap = new Map((users || []).map((u: { id: string; full_name: string }) => [u.id, u.full_name]));
    const creatorMap = new Map((creators || []).map((u: { id: string; full_name: string }) => [u.id, u.full_name]));
    const caseNumberMap = new Map(cases.map((c: { id: string; case_number: string }) => [c.id, c.case_number]));

    // For comprehensive export, fetch related data
    let actions: unknown[] = [];
    let documents: unknown[] = [];
    let invoices: unknown[] = [];

    if (comprehensive && caseIds.length > 0) {
      // Fetch case actions with executor
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: actionsData } = await (supabase.from('case_actions') as any)
        .select('*')
        .in('case_id', caseIds)
        .order('sort_order', { ascending: true });

      if (actionsData) {
        const executorIds = Array.from(new Set(actionsData.map((a: { executor_id: string }) => a.executor_id).filter(Boolean)));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: executors } = executorIds.length > 0
          ? await (supabase.from('partners') as any).select('id, name').in('id', executorIds)
          : { data: [] };
        const executorMap = new Map((executors || []).map((e: { id: string; name: string }) => [e.id, e.name]));

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        actions = actionsData.map((a: any) => ({
          case_number: caseNumberMap.get(a.case_id) || '',
          service_name: a.service_name || '',
          service_description: a.service_description || '',
          executor_name: executorMap.get(a.executor_id) || '',
          service_cost: a.service_cost || 0,
          service_currency: a.service_currency || 'GEL',
          assistance_cost: a.assistance_cost || 0,
          assistance_currency: a.assistance_currency || 'GEL',
          commission_cost: a.commission_cost || 0,
          commission_currency: a.commission_currency || 'GEL',
          service_date: a.service_date || '',
          comment: a.comment || '',
          created_at: a.created_at || '',
        }));
      }

      // Fetch case documents
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: docsData } = await (supabase.from('case_documents') as any)
        .select('*')
        .in('case_id', caseIds)
        .order('created_at', { ascending: false });

      if (docsData) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        documents = docsData.map((d: any) => ({
          case_number: caseNumberMap.get(d.case_id) || '',
          type: d.type || '',
          file_name: d.file_name || '',
          file_size: d.file_size || 0,
          mime_type: d.mime_type || '',
          created_at: d.created_at || '',
        }));
      }

      // Fetch invoices with recipient and sender
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: invoicesData } = await (supabase.from('invoices') as any)
        .select('*')
        .in('case_id', caseIds)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (invoicesData) {
        const recipientIds = Array.from(new Set(invoicesData.map((i: { recipient_id: string }) => i.recipient_id).filter(Boolean)));
        const senderIds = Array.from(new Set(invoicesData.map((i: { sender_id: string }) => i.sender_id).filter(Boolean)));

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: recipients } = recipientIds.length > 0
          ? await (supabase.from('partners') as any).select('id, name').in('id', recipientIds)
          : { data: [] };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: senders } = senderIds.length > 0
          ? await (supabase.from('our_companies') as any).select('id, name').in('id', senderIds)
          : { data: [] };

        const recipientMap = new Map((recipients || []).map((r: { id: string; name: string }) => [r.id, r.name]));
        const senderMap = new Map((senders || []).map((s: { id: string; name: string }) => [s.id, s.name]));

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        invoices = invoicesData.map((i: any) => ({
          case_number: caseNumberMap.get(i.case_id) || '',
          invoice_number: i.invoice_number || '',
          status: i.status || '',
          recipient_name: recipientMap.get(i.recipient_id) || '',
          sender_name: senderMap.get(i.sender_id) || '',
          currency: i.currency || 'GEL',
          subtotal: i.subtotal || 0,
          franchise: i.franchise || 0,
          total: i.total || 0,
          paid_amount: i.paid_amount || 0,
          paid_at: i.paid_at || '',
          created_at: i.created_at || '',
        }));
      }
    }

    // Status and priority translations
    const statusLabels: Record<string, string> = {
      draft: 'დრაფტი',
      in_progress: 'მიმდინარე',
      paused: 'შეჩერებული',
      delayed: 'შეფერხებული',
      completed: 'დასრულებული',
      cancelled: 'გაუქმებული',
    };

    const priorityLabels: Record<string, string> = {
      low: 'დაბალი',
      normal: 'ჩვეულებრივი',
      high: 'მაღალი',
      urgent: 'სასწრაფო',
    };

    // Transform cases data for export
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const exportCases = cases.map((c: any) => ({
      case_number: c.case_number || '',
      status: statusLabels[c.status] || c.status || '',
      patient_name: c.patient_name || '',
      patient_id: c.patient_id || '',
      patient_dob: c.patient_dob || '',
      patient_phone: c.patient_phone || '',
      patient_email: c.patient_email || '',
      insurance_name: insuranceMap.get(c.insurance_id) || '',
      insurance_policy_number: c.insurance_policy_number || '',
      client_name: clientMap.get(c.client_id) || '',
      assigned_user: userMap.get(c.assigned_to) || '',
      is_medical: c.is_medical ? 'დიახ' : 'არა',
      is_documented: c.is_documented ? 'დიახ' : 'არა',
      priority: priorityLabels[c.priority] || c.priority || '',
      complaints: c.complaints || '',
      needs: c.needs || '',
      diagnosis: c.diagnosis || '',
      treatment_notes: c.treatment_notes || '',
      opened_at: c.opened_at || '',
      closed_at: c.closed_at || '',
      total_service_cost: c.total_service_cost || 0,
      total_assistance_cost: c.total_assistance_cost || 0,
      total_commission_cost: c.total_commission_cost || 0,
      actions_count: c.actions_count || 0,
      documents_count: c.documents_count || 0,
      invoices_count: c.invoices_count || 0,
      creator_name: creatorMap.get(c.created_by) || '',
      created_at: c.created_at || '',
    }));

    if (format === 'json') {
      if (comprehensive) {
        return NextResponse.json({
          success: true,
          data: {
            cases: exportCases,
            actions,
            documents,
            invoices,
          },
        });
      }
      return NextResponse.json({ success: true, data: exportCases });
    }

    // Generate basic CSV (for non-comprehensive export)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const simpleCases = cases.map((c: any) => ({
      'ქეისის ნომერი': c.case_number || '',
      'სტატუსი': statusLabels[c.status] || c.status || '',
      'პაციენტი': c.patient_name || '',
      'პაციენტის ID': c.patient_id || '',
      'დაბადების თარიღი': c.patient_dob || '',
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

    const headers = Object.keys(simpleCases[0]);
    const csvRows = [
      headers.join(','),
      ...simpleCases.map((row: Record<string, string>) =>
        headers.map(h => {
          const val = String(row[h] || '');
          if (val.includes(',') || val.includes('"') || val.includes('\n')) {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        }).join(',')
      ),
    ];
    const csvContent = '\uFEFF' + csvRows.join('\n');

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
