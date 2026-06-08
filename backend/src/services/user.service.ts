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


   // Get user by email (with password for login)
  async findByEmailWithPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });


    return user;
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
}

export default new UserService();
