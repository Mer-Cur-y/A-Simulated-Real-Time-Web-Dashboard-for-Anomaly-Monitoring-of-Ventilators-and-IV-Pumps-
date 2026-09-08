export type UserRole = "admin" | "staff";

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  created_at: string;
}