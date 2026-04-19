import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { categorySchema } from '@/lib/utils/validation';
import type { Category, CategoryWithCount } from '@/types';

// Roles that can manage categories
const ADMIN_ROLES = ['super_admin', 'manager'];

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

    // Fetch categories and active-partner counts in parallel
    const [
      { data: categoriesData, error: categoriesError },
      { data: partnerRows },
    ] = await Promise.all([
      supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true }),
      // Only count active (non-soft-deleted) partners
      supabase
        .from('partners')
        .select('category_id')
        .is('deleted_at', null),
    ]);

    if (categoriesError) throw categoriesError;

    // Count partners per category (excluding soft-deleted)
    const countByCategory = new Map<string, number>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (partnerRows || []).forEach((row: any) => {
      if (!row.category_id) return;
      countByCategory.set(row.category_id, (countByCategory.get(row.category_id) || 0) + 1);
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const categories = (categoriesData || []).map((cat: any) => ({
      ...cat,
      partners_count: countByCategory.get(cat.id) || 0,
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

    // Check if user is admin
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
