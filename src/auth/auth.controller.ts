import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResponseDto } from '../_shared/dto/response.dto';

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
    const userId = req.user.id;
    return this.authService.logout(userId);
  }
}
