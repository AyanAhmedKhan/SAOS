import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { storage } from '../storage';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  static generateToken(userId: string, role: string): string {
    return jwt.sign(
      { userId, role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
  }

  static verifyToken(token: string): { userId: string; role: string } | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      return { userId: decoded.userId, role: decoded.role };
    } catch (error) {
      return null;
    }
  }

  static async authenticate(username: string, password: string) {
    const user = await storage.getUserByUsername(username);
    
    if (!user) {
      throw new Error('User not found');
    }

    const isValidPassword = await this.verifyPassword(password, user.password);
    
    if (!isValidPassword) {
      throw new Error('Invalid password');
    }

    const token = this.generateToken(user.id, user.role);
    
    return {
      user: { ...user, password: undefined },
      token
    };
  }

  static async register(userData: {
    username: string;
    email: string;
    password: string;
    name: string;
    role?: 'farmer' | 'agronomist' | 'coop_admin';
  }) {
    // Check if user already exists
    const existingUser = await storage.getUserByUsername(userData.username);
    if (existingUser) {
      throw new Error('Username already exists');
    }

    const existingEmail = await storage.getUserByEmail(userData.email);
    if (existingEmail) {
      throw new Error('Email already exists');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(userData.password);

    // Create user
    const user = await storage.createUser({
      ...userData,
      password: hashedPassword,
      role: userData.role || 'farmer'
    });

    const token = this.generateToken(user.id, user.role);

    return {
      user: { ...user, password: undefined },
      token
    };
  }
}
