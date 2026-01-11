import { useQuery } from '@tanstack/react-query';
import type { User } from '@/types';

export const USERS_QUERY_KEY = ['users'];

async function getUsers(): Promise<User[]> {
  const response = await fetch('/api/users');
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error?.message || 'მომხმარებლების ჩატვირთვა ვერ მოხერხდა');
  }
  
  return result.data || [];
}

export function useUsers() {
  return useQuery({
    queryKey: USERS_QUERY_KEY,
    queryFn: getUsers,
  });
}
