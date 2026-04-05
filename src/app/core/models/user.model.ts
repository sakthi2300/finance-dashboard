export type UserRole = 'admin' | 'viewer';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}
