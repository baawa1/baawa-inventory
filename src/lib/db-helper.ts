import { prisma } from "@/lib/db";

// Database helper functions using Prisma
export const dbHelper = {
  // User operations
  async findUserByEmail(email: string) {
    const user = await prisma.user.findFirst({
      where: {
        email: email,
        isActive: true,
      },
    });

    return user;
  },

  async findUserByResetToken(token: string) {
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        isActive: true,
        resetTokenExpires: {
          gt: new Date(),
        },
      },
    });

    return user;
  },

  async updateUserResetToken(
    userId: number,
    resetToken: string,
    resetTokenExpires: Date
  ) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        resetToken: resetToken,
        resetTokenExpires: resetTokenExpires,
      },
    });

    return user;
  },

  async updateUserPassword(userId: number, hashedPassword: string) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpires: null,
        updatedAt: new Date(),
      },
    });

    return user;
  },
};
