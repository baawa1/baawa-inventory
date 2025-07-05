import { User } from "@prisma/client";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

/**
 * Database service that provides a consistent interface for user operations
 * Now using Prisma for all database operations
 */
export const dbService = {
  user: {
    async findUnique(params: {
      where: { email?: string; id?: number };
    }): Promise<User | null> {
      const where: any = {};

      if (params.where.email) {
        where.email = params.where.email;
      }
      if (params.where.id) {
        where.id = params.where.id;
      }

      where.isActive = true;

      const user = await prisma.user.findFirst({
        where,
      });

      return user;
    },

    async findFirst(params: {
      where: {
        resetToken?: string;
        resetTokenExpires?: { gt: Date };
        isActive?: boolean;
      };
    }): Promise<User | null> {
      const where: any = {};

      if (params.where.resetToken) {
        where.resetToken = params.where.resetToken;
      }
      if (params.where.resetTokenExpires?.gt) {
        where.resetTokenExpires = {
          gt: params.where.resetTokenExpires.gt,
        };
      }
      if (params.where.isActive !== undefined) {
        where.isActive = params.where.isActive;
      }

      const user = await prisma.user.findFirst({
        where,
      });

      return user;
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
        updateData.resetToken = params.data.resetToken;
      }
      if (params.data.resetTokenExpires !== undefined) {
        updateData.resetTokenExpires = params.data.resetTokenExpires;
      }
      if (params.data.password) {
        updateData.password = params.data.password;
      }
      if (params.data.updatedAt) {
        updateData.updatedAt = params.data.updatedAt;
      }

      const user = await prisma.user.update({
        where: { id: params.where.id },
        data: updateData,
      });

      return user;
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

      const user = await prisma.user.create({
        data: {
          firstName: params.data.firstName,
          lastName: params.data.lastName,
          email: params.data.email,
          password: hashedPassword,
          phone: params.data.phone || null,
          role: (params.data.role as any) || "EMPLOYEE",
          isActive: params.data.isActive !== false,
        },
      });

      return user;
    },
  },
};
