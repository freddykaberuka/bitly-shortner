import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResponseDto } from '../_shared/dto/response.dto';
import { JwtGuard } from './guards/jwt.guard';


type User = {
  id: number;
  email: string;
};

declare module 'express' {
  interface Request {
    user?: User;
  }
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<ResponseDto> {
    const res = await this.authService.register(dto);
    return new ResponseDto(HttpStatus.CREATED, res);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto): Promise<ResponseDto> {
    const { accessToken, refreshToken } = await this.authService.login(dto);
    return new ResponseDto(HttpStatus.OK, 'Login successful', {
      accessToken,
      refreshToken,
    });
  }

  @Post('logout')
  @UseGuards(JwtGuard)
  async logout(@Req() req: Request): Promise<string> {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    const userId = req.user.id;
    return this.authService.logout(userId);
  }
}