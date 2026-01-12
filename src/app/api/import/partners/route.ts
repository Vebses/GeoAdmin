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

// POST /api/import/partners - Import partners from CSV data
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
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

    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      // Validate required field
      if (!row.name || row.name.trim() === '') {
        result.failed++;
        result.errors.push({ row: i + 1, error: 'სახელი სავალდებულოა' });
        continue;
      }

      // Check for duplicate by name or id_code
      if (row.id_code) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: existing } = await (supabase
          .from('partners') as any)
          .select('id')
          .eq('id_code', row.id_code)
          .is('deleted_at', null)
          .single();

        if (existing) {
          result.failed++;
          result.errors.push({ row: i + 1, error: `ID კოდი "${row.id_code}" უკვე არსებობს` });
          continue;
        }
      }

      // Prepare data for insert
      const partnerData = {
        name: row.name.trim(),
        legal_name: row.legal_name?.trim() || null,
        id_code: row.id_code?.trim() || null,
        category_id: row.category_id || categoryId || null,
        country: row.country?.trim() || null,
        city: row.city?.trim() || null,
        address: row.address?.trim() || null,
        email: row.email?.trim() || null,
        phone: row.phone?.trim() || null,
        contact_person: row.contact_person?.trim() || null,
        notes: row.notes?.trim() || null,
      };

      // Insert partner
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase
        .from('partners') as any)
        .insert(partnerData);

      if (error) {
        result.failed++;
        result.errors.push({ row: i + 1, error: error.message });
      } else {
        result.success++;
      }
    }

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
