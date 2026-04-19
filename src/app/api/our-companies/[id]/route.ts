import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ourCompanySchema } from '@/lib/utils/validation';
import { getSignedFileUrl } from '@/lib/storage-urls';

// Roles that can manage our companies
const ADMIN_ROLES = ['super_admin', 'manager'];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) throw error;

    if (!data) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'კომპანია ვერ მოიძებნა' } },
        { status: 404 }
      );
    }

    // Resolve stored paths to signed URLs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = data as any;
    const [logo_url, signature_url, stamp_url] = await Promise.all([
      getSignedFileUrl(supabase, c.logo_url),
      getSignedFileUrl(supabase, c.signature_url),
      getSignedFileUrl(supabase, c.stamp_url),
    ]);
    const withSigned = {
      ...c,
      logo_url: logo_url || c.logo_url,
      signature_url: signature_url || c.signature_url,
      stamp_url: stamp_url || c.stamp_url,
    };

    return NextResponse.json({ success: true, data: withSigned });
  } catch (error) {
    console.error('Our Company GET error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'სერვერის შეცდომა' } },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'არაავტორიზებული' } },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !ADMIN_ROLES.includes((profile as any)?.role)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'მხოლოდ ადმინისტრატორებს შეუძლიათ' } },
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
        .neq('id', id);
    }

    const { data, error } = await (supabase
      .from('our_companies') as any)
      .update({
        ...companyData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Our Company PUT error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'სერვერის შეცდომა' } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'არაავტორიზებული' } },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !ADMIN_ROLES.includes((profile as any)?.role)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'მხოლოდ ადმინისტრატორებს შეუძლიათ' } },
        { status: 403 }
      );
    }

    // Soft delete
    const { error } = await (supabase
      .from('our_companies') as any)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'კომპანია წაშლილია' });
  } catch (error) {
    console.error('Our Company DELETE error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'სერვერის შეცდომა' } },
      { status: 500 }
    );
  }
}
