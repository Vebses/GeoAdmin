import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface PartnerRow {
  name: string;
  legal_name?: string;
  id_code?: string;
  category_id?: string;
  country?: string;
  city?: string;
  address?: string;
  email?: string;
  phone?: string;
  contact_person?: string;
  notes?: string;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: { row: number; error: string }[];
}

const ADMIN_ROLES = ['super_admin', 'manager'];
const MAX_IMPORT_ROWS = 1000;

// POST /api/import/partners - Import partners from CSV data
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'არაავტორიზებული' } },
        { status: 401 }
      );
    }

    // Check role - only admins can import
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userData } = await (supabase
      .from('users') as any)
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || !ADMIN_ROLES.includes(userData.role)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'მხოლოდ ადმინისტრატორებს შეუძლიათ იმპორტი' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { rows, categoryId } = body as { rows: PartnerRow[]; categoryId?: string };

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'No data to import' } },
        { status: 400 }
      );
    }

    // Enforce row limit
    if (rows.length > MAX_IMPORT_ROWS) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: `მაქსიმუმ ${MAX_IMPORT_ROWS} ჩანაწერის იმპორტი შეიძლება ერთდროულად` } },
        { status: 400 }
      );
    }

    // Validate categoryId as UUID if provided
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (categoryId && !uuidRegex.test(categoryId)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'არასწორი კატეგორიის ID' } },
        { status: 400 }
      );
    }

    // Call the atomic import RPC — entire batch runs in a single DB function call.
    // Per-row errors are captured without aborting the batch; critical errors roll everything back.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('bulk_import_partners', {
      rows_json: rows,
      p_category_id: categoryId || null,
    });

    if (error) {
      console.error('Import RPC error:', error);
      return NextResponse.json(
        { success: false, error: { code: 'IMPORT_FAILED', message: error.message || 'იმპორტი ვერ მოხერხდა' } },
        { status: 500 }
      );
    }

    // Normalize RPC result to match existing response shape
    const rpcResult = (data || {}) as { success?: number; skipped?: number; failed?: number; errors?: Array<{ row: number; error: string }> };
    const result: ImportResult = {
      success: rpcResult.success || 0,
      failed: (rpcResult.failed || 0) + (rpcResult.skipped || 0),
      errors: rpcResult.errors || [],
    };

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Import partners error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Import failed' } },
      { status: 500 }
    );
  }
}
