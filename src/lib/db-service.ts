import { User } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

// Supabase client for direct database operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Database service that uses Prisma types but Supabase client for operations
 * This is a workaround for Prisma connection issues with Supabase
 */
export const dbService = {
  user: {
    async findUnique(params: {
      where: { email?: string; id?: number };
    }): Promise<User | null> {
      let query = supabase.from("users").select("*");

      if (params.where.email) {
        query = query.eq("email", params.where.email);
      }
      if (params.where.id) {
        query = query.eq("id", params.where.id);
      }

      query = query.eq("is_active", true);

      const { data, error } = await query.single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 is "not found"
        throw new Error(`Database error: ${error.message}`);
      }

      // Transform Supabase response to match Prisma User type
      if (!data) return null;

      return {
        id: data.id,
        firstName: data.first_name,
        lastName: data.last_name,
        email: data.email,
        password: data.password_hash,
        phone: data.phone,
        role: data.role,
        isActive: data.is_active,
        notes: data.notes,
        lastLogin: data.last_login ? new Date(data.last_login) : null,
        lastLogout: data.last_logout ? new Date(data.last_logout) : null,
        lastActivity: data.last_activity ? new Date(data.last_activity) : null,
        resetToken: data.reset_token,
        resetTokenExpires: data.reset_token_expires
          ? new Date(data.reset_token_expires)
          : null,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      } as User;
    },

    async findFirst(params: {
      where: {
        resetToken?: string;
        resetTokenExpires?: { gt: Date };
        isActive?: boolean;
      };
    }): Promise<User | null> {
      let query = supabase.from("users").select("*");

      if (params.where.resetToken) {
        query = query.eq("reset_token", params.where.resetToken);
      }
      if (params.where.resetTokenExpires?.gt) {
        query = query.gt(
          "reset_token_expires",
          params.where.resetTokenExpires.gt.toISOString()
        );
      }
      if (params.where.isActive !== undefined) {
        query = query.eq("is_active", params.where.isActive);
      }

      const { data, error } = await query.single();

      if (error && error.code !== "PGRST116") {
        throw new Error(`Database error: ${error.message}`);
      }

      if (!data) return null;

      return {
        id: data.id,
        firstName: data.first_name,
        lastName: data.last_name,
        email: data.email,
        password: data.password_hash,
        phone: data.phone,
        role: data.role,
        isActive: data.is_active,
        notes: data.notes,
        lastLogin: data.last_login ? new Date(data.last_login) : null,
        lastLogout: data.last_logout ? new Date(data.last_logout) : null,
        lastActivity: data.last_activity ? new Date(data.last_activity) : null,
        resetToken: data.reset_token,
        resetTokenExpires: data.reset_token_expires
          ? new Date(data.reset_token_expires)
          : null,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      } as User;
    },

    async update(params: {
      where: { id: number };
      data: {
        resetToken?: string | null;
        resetTokenExpires?: Date | null;
        password?: string;
        updatedAt?: Date;
      };
    }): Promise<User> {
      const updateData: any = {};

      if (params.data.resetToken !== undefined) {
        updateData.reset_token = params.data.resetToken;
      }
      if (params.data.resetTokenExpires !== undefined) {
        updateData.reset_token_expires =
          params.data.resetTokenExpires?.toISOString() || null;
      }
      if (params.data.password) {
        updateData.password_hash = params.data.password;
      }
      if (params.data.updatedAt) {
        updateData.updated_at = params.data.updatedAt.toISOString();
      }

      const { data, error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", params.where.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        id: data.id,
        firstName: data.first_name,
        lastName: data.last_name,
        email: data.email,
        password: data.password_hash,
        phone: data.phone,
        role: data.role,
        isActive: data.is_active,
        notes: data.notes,
        lastLogin: data.last_login ? new Date(data.last_login) : null,
        lastLogout: data.last_logout ? new Date(data.last_logout) : null,
        lastActivity: data.last_activity ? new Date(data.last_activity) : null,
        resetToken: data.reset_token,
        resetTokenExpires: data.reset_token_expires
          ? new Date(data.reset_token_expires)
          : null,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      } as User;
    },

    async create(params: {
      data: {
        firstName: string;
        lastName: string;
        email: string;
        password: string;
        phone?: string;
        role?: string;
        isActive?: boolean;
      };
    }): Promise<User> {
      const hashedPassword = await bcrypt.hash(params.data.password, 12);

      const { data, error } = await supabase
        .from("users")
        .insert({
          first_name: params.data.firstName,
          last_name: params.data.lastName,
          email: params.data.email,
          password_hash: hashedPassword,
          phone: params.data.phone || null,
          role: params.data.role || "STAFF",
          is_active: params.data.isActive !== false,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        id: data.id,
        firstName: data.first_name,
        lastName: data.last_name,
        email: data.email,
        password: data.password_hash,
        phone: data.phone,
        role: data.role,
        isActive: data.is_active,
        notes: data.notes,
        lastLogin: data.last_login ? new Date(data.last_login) : null,
        lastLogout: data.last_logout ? new Date(data.last_logout) : null,
        lastActivity: data.last_activity ? new Date(data.last_activity) : null,
        resetToken: data.reset_token,
        resetTokenExpires: data.reset_token_expires
          ? new Date(data.reset_token_expires)
          : null,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      } as User;
    },
  },
};
