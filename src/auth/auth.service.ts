import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

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
   * Login user
   * @param dto LoginDto
   * @returns Access and refresh tokens
   */
  async login(
    dto: LoginDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { email, password } = dto;

    // Find the user by email
    const user = await this.prismaService.user.findFirst({
      where: { email },
    });
    if (!user) {
      throw new BadRequestException('The email or password is incorrect');
    }

    // Compare passwords
    const isMatch = this.comparePassword(password, user.password);
    if (!isMatch) {
      throw new BadRequestException('The email or password is incorrect');
    }

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens({
      id: user.id,
    });

    // Update user with refresh token
    await this.prismaService.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    return { accessToken, refreshToken };
  }

  /**
   * Generate access and refresh tokens
   * @param payload JwtPayload
   * @returns Tokens
   */
  private async generateTokens(payload: { id: number }) {
    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: '7d',
    });
    return { accessToken, refreshToken };
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

  /**
   * Compare password with hash
   * @param password Password to compare
   * @param hash Password hash
   * @returns Boolean result
   */
  private comparePassword(password: string, hash: string): boolean {
    return bcrypt.compareSync(password, hash);
  }

  /**
   * Logout user by removing their refresh token
   * @param userId The ID of the user
   * @returns Success message
   */
  async logout(userId: number): Promise<string> {
    // Remove the refresh token from the database
    await this.prismaService.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    return 'Logout successful';
  }
}
