import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { UrlService } from './url.service';
import { ShortenUrlDto } from './dto/shorten-url.dto';

@Controller('url')
export class UrlController {
  constructor(private readonly urlService: UrlService) {}

  @Post('shorten')
  async shortenUrl(@Body() dto: ShortenUrlDto) {
    return this.urlService.shortenUrl(dto);
  }

  @Get(':shortCode')
  async redirect(@Param('shortCode') shortCode: string) {
    const longUrl = await this.urlService.getLongUrl(shortCode);
    return { url: longUrl };
  }

}