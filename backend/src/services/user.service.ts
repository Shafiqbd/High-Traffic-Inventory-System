import { prisma } from '../config/database.js';
import bcrypt from 'bcrypt';
import type { CreateUserDto, UpdateUserDto } from '../types/user.types.js';

const SALT_ROUNDS = 10;

class UserService {
  // Get all users
  async findAll() {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        _count: {
          select: {
            reservations: true,
            purchases: true,
          },
        },
      },
    });

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt.toISOString(),
      reservationsCount: user._count.reservations,
      purchasesCount: user._count.purchases,
    }));
  }

  // Get user by ID (without password)
  async findById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        _count: {
          select: {
            reservations: true,
            purchases: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt.toISOString(),
      reservationsCount: user._count.reservations,
      purchasesCount: user._count.purchases,
    };
  }

  // Get user by email (with password for login)
  async findByEmailWithPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    return user;
  }

  // Get user by email (without password)
  async findByEmail(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt.toISOString(),
    };
  }

  // Create new user with hashed password
  async create(data: CreateUserDto) {
    const { email, name, password } = data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        password: hashedPassword,
      },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt.toISOString(),
    };
  }

  // Verify password for login
  async verifyPassword(email: string, password: string) {
    const user = await this.findByEmailWithPassword(email);

    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }

  // Update user
  async update(id: string, data: UpdateUserDto) {
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return null;
    }

    // If updating email, check if it's already taken
    if (data.email && data.email !== existingUser.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (emailTaken) {
        throw new Error('Email is already taken');
      }
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email) updateData.email = data.email;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      createdAt: updatedUser.createdAt.toISOString(),
    };
  }

  // Delete user
  async delete(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            reservations: true,
            purchases: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    // Don't allow deletion if user has reservations or purchases
    if (user._count.reservations > 0 || user._count.purchases > 0) {
      throw new Error('Cannot delete user with existing reservations or purchases');
    }

    await prisma.user.delete({
      where: { id },
    });

    return true;
  }
}

export default new UserService();
