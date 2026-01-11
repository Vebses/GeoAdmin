import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { categorySchema } from '@/lib/utils/validation';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // Check auth
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

    // Parse and validate request body
    const body = await request.json();
    const validationResult = categorySchema.safeParse(body);
    
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

    const categoryData = validationResult.data;

    // Update category
    const { data: updatedCategory, error } = await (supabase
      .from('categories') as any)
      .update({
        ...categoryData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!updatedCategory) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'კატეგორია ვერ მოიძებნა' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedCategory,
    });
  } catch (error) {
    console.error('Categories PUT error:', error);
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
    
    // Check auth
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

    // Check if category is system
    const { data: category } = await supabase
      .from('categories')
      .select('is_system')
      .eq('id', id)
      .single();

    if (!category) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'კატეგორია ვერ მოიძებნა' } },
        { status: 404 }
      );
    }

    if ((category as any).is_system) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'სისტემური კატეგორიის წაშლა შეუძლებელია' } },
        { status: 403 }
      );
    }

    // Check if category has partners
    const { count } = await supabase
      .from('partners')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id)
      .is('deleted_at', null);

    if (count && count > 0) {
      return NextResponse.json(
        { success: false, error: { code: 'HAS_RELATIONS', message: 'კატეგორიას აქვს პარტნიორები, ჯერ წაშალეთ პარტნიორები' } },
        { status: 400 }
      );
    }

    // Delete category
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'კატეგორია წაშლილია',
    });
  } catch (error) {
    console.error('Categories DELETE error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'სერვერის შეცდომა' } },
      { status: 500 }
    );
  }
}
