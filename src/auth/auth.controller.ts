import { Body, Controller, Post, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { ResponseDto } from '../_shared/dto/response.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Register a new user
   * @param dto RegisterDto
   * @returns Success message
   */
  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<ResponseDto> {
    const res = await this.authService.register(dto);
    return new ResponseDto(HttpStatus.CREATED, res);
  }
}
