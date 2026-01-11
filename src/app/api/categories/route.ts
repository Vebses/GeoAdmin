import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { categorySchema } from '@/lib/utils/validation';
import type { Category, CategoryWithCount } from '@/types';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'არაავტორიზებული' } },
        { status: 401 }
      );
    }

    // Fetch categories with partner counts
    const { data, error } = await supabase
      .from('categories')
      .select(`
        *,
        partners:partners(count)
      `)
      .order('sort_order', { ascending: true });

    if (error) throw error;

    // Transform data to include partner count
    const categories = (data || []).map((cat: any) => ({
      ...cat,
      partners_count: cat.partners?.[0]?.count || 0,
    }));

    return NextResponse.json({
      success: true,
      data: categories as CategoryWithCount[],
    });
  } catch (error) {
    console.error('Categories GET error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'სერვერის შეცდომა' } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
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

    // Get max sort_order
    const { data: maxOrder } = await supabase
      .from('categories')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();

    // Create category
    const { data: newCategory, error } = await supabase
      .from('categories')
      .insert({
        ...categoryData,
        is_system: false,
        sort_order: ((maxOrder as any)?.sort_order || 0) + 1,
      } as any)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: newCategory as Category,
    }, { status: 201 });
  } catch (error) {
    console.error('Categories POST error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'სერვერის შეცდომა' } },
      { status: 500 }
    );
  }
}
