import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ourCompanySchema } from '@/lib/utils/validation';
import type { OurCompany } from '@/types';

export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'არაავტორიზებული' } },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from('our_companies')
      .select('*')
      .is('deleted_at', null)
      .order('is_default', { ascending: false })
      .order('name', { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data as OurCompany[],
    });
  } catch (error) {
    console.error('Our Companies GET error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'სერვერის შეცდომა' } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'არაავტორიზებული' } },
        { status: 401 }
      );
    }

    // Check if user is manager
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if ((profile as any)?.role !== 'manager') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'მხოლოდ მენეჯერს შეუძლია' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validationResult = ourCompanySchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'ვალიდაციის შეცდომა',
            details: validationResult.error.flatten().fieldErrors 
          } 
        },
        { status: 400 }
      );
    }

    const companyData = validationResult.data;

    // If this is set as default, unset other defaults
    if (companyData.is_default) {
      await (supabase
        .from('our_companies') as any)
        .update({ is_default: false })
        .neq('id', '00000000-0000-0000-0000-000000000000');
    }

    const { data: newCompany, error } = await (supabase
      .from('our_companies') as any)
      .insert(companyData)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: newCompany as OurCompany,
    }, { status: 201 });
  } catch (error) {
    console.error('Our Companies POST error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'სერვერის შეცდომა' } },
      { status: 500 }
    );
  }
}
