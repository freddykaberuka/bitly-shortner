import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Register a new user
   * @param dto RegisterDto
   * @returns Success message
   */
  async register(dto: RegisterDto): Promise<string> {
    const { email, password, username, name: fullname } = dto;

    return this.prismaService.$transaction(async (tx) => {
      // Check if user already exists
      const user = await tx.user.findFirst({
        where: {
          OR: [{ email }, { username }],
        },
      });
      const userProfile = await tx.userProfile.findFirst({
        where: { name: fullname },
      });
      if (user || userProfile) {
        throw new BadRequestException('User already exists');
      }

      // Hash password
      const hashedPassword = await this.hashPassword(password);

      // Create user
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          username,
          status: 'NEW', // Default status
        },
      });
      if (!newUser?.id) {
        throw new BadRequestException(
          'Unable to create user! Please check your input.',
        );
      }

      // Create user profile
      await tx.userProfile.create({
        data: {
          name: fullname,
          userId: newUser.id,
        },
      });

      return `Hi (${newUser.username}) your account has been created.`;
    });
  }

  /**
   * Hash password
   * @param password Password to hash
   * @returns Hashed password
   */
  private async hashPassword(password: string): Promise<string> {
    const salt = bcrypt.genSaltSync();
    return bcrypt.hashSync(password, salt);
  }
}
