import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { partnerSchema } from '@/lib/utils/validation';
import { requireAuth, isAuthError, ADMIN_ROLES } from '@/lib/auth-utils';
import { sanitizeSearchTerm, clampPagination } from '@/lib/utils/query-guards';
import type { Partner } from '@/types';

export async function GET(request: Request) {
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

    // Parse query params
    const { searchParams } = new URL(request.url);
    const category_id = searchParams.get('category_id');
    const search = searchParams.get('search');
    const { page, limit } = clampPagination(searchParams.get('page'), searchParams.get('limit'), { defaultLimit: 20 });
    const SORTABLE = ['name', 'legal_name', 'created_at', 'city', 'country'];
    const sortParam = searchParams.get('sort') || 'name';
    const sort = SORTABLE.includes(sortParam) ? sortParam : 'name';
    const order = searchParams.get('order') === 'desc' ? 'desc' : 'asc';

    // Build query
    let query = supabase
      .from('partners')
      .select(`
        *,
        category:categories(id, name, name_en, color, icon)
      `, { count: 'exact' })
      .is('deleted_at', null);

    // Apply filters
    if (category_id) {
      query = query.eq('category_id', category_id);
    }

    if (search) {
      const safe = sanitizeSearchTerm(search);
      if (safe) {
        query = query.or(`name.ilike.%${safe}%,legal_name.ilike.%${safe}%,id_code.ilike.%${safe}%`);
      }
    }

    // Apply sorting
    query = query.order(sort, { ascending: order === 'asc' });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data as Partner[],
      meta: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Partners GET error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'სერვერის შეცდომა' } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Only admins can create partners
    const auth = await requireAuth(ADMIN_ROLES);
    if (isAuthError(auth)) return auth.response;

    const supabase = await createClient();

    // Parse and validate request body
    const body = await request.json();
    const validationResult = partnerSchema.safeParse(body);
    
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

    const partnerData = validationResult.data;

    // Create partner
    const { data: newPartner, error } = await supabase
      .from('partners')
      .insert(partnerData as any)
      .select(`
        *,
        category:categories(id, name, name_en, color, icon)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: newPartner as Partner,
    }, { status: 201 });
  } catch (error) {
    console.error('Partners POST error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'სერვერის შეცდომა' } },
      { status: 500 }
    );
  }
}
