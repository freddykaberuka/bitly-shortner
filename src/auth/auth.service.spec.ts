import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma.service';
import { RegisterDto } from './dto/register.dto';

describe('AuthService', () => {
  let authService: AuthService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findFirst: jest.fn(),
              create: jest.fn(),
            },
            userProfile: {
              findFirst: jest.fn(),
              create: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const registerDto: RegisterDto = {
        email: 'fred@test.com',
        username: 'fred trojan',
        password: 'password123',
        name: 'fred',
      };

      // Mock Prisma methods
      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(null);
      jest
        .spyOn(prismaService.userProfile, 'findFirst')
        .mockResolvedValue(null);
      jest.spyOn(prismaService.user, 'create').mockResolvedValue({
        id: 1,
        email: 'fred@test.com',
        username: 'fred trojan',
        password: 'hashedPassword',
        status: 'NEW',
        createdAt: new Date(),
        deletedAt: null,
      });
      jest.spyOn(prismaService.userProfile, 'create').mockResolvedValue({
        id: 1,
        name: 'fred',
        userId: 1,
        createdAt: new Date(),
        deletedAt: null,
        birthdate: null,
        location: null,
        image: null,
      });
      jest
        .spyOn(prismaService, '$transaction')
        .mockImplementation(async (callback) => {
          return callback(prismaService);
        });

      const result = await authService.register(registerDto);

      expect(result).toBe('Hi (fred) your account has been created.');
      expect(prismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [{ email: 'fred@test.com' }, { username: 'johndoe' }],
        },
      });
      expect(prismaService.userProfile.findFirst).toHaveBeenCalledWith({
        where: { name: 'fred' },
      });
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: 'fred@test.com',
          password: expect.any(String),
          username: 'fred trojan',
          status: 'NEW',
        },
      });
      expect(prismaService.userProfile.create).toHaveBeenCalledWith({
        data: {
          name: 'fred',
          userId: 1,
        },
      });
    });

    it('should throw an error if user already exists', async () => {
      const registerDto: RegisterDto = {
        email: 'fred@test.com',
        username: 'fred trojan',
        password: 'password123',
        name: 'fred',
      };

      // Mock Prisma methods to simulate an existing user
      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue({
        id: 1,
        email: 'fred@test.com',
        username: 'fred trojan',
        password: 'hashedPassword',
        status: 'NEW',
        createdAt: new Date(),
        deletedAt: null,
      });
      jest
        .spyOn(prismaService.userProfile, 'findFirst')
        .mockResolvedValue(null); // Add this line
      jest
        .spyOn(prismaService, '$transaction')
        .mockImplementation(async (callback) => {
          return callback(prismaService);
        });

      await expect(authService.register(registerDto)).rejects.toThrow(
        'User already exists',
      );
    });
  });
});
