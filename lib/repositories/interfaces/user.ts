export interface UserData {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  emailVerified: Date | null;
}

export interface UserWithRoles extends UserData {
  roles: string[];
}

export interface FindAllWithCountResult {
  data: UserWithRoles[];
  total: number;
}

export interface UserRepository {
  findAll(options?: {
    limit?: number;
    offset?: number;
    search?: string;
  }): Promise<UserWithRoles[]>;
  findAllWithCount(options?: {
    limit?: number;
    offset?: number;
    search?: string;
  }): Promise<FindAllWithCountResult>;
  findById(id: string): Promise<UserWithRoles | null>;
  count(search?: string): Promise<number>;
  setRoles(userId: string, roles: string[]): Promise<void>;
  delete(id: string): Promise<void>;
}
