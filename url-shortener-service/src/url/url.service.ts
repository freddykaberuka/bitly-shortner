import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ShortenUrlDto } from './dto/shorten-url.dto';

@Injectable()
export class UrlService {
  constructor(private prisma: PrismaService) {}

  async shortenUrl(dto: ShortenUrlDto) {
    const { longUrl, userId } = dto;
    const shortCode = this.generateShortCode();

    const url = await this.prisma.url.create({
      data: {
        longUrl,
        shortCode,
        userId,
      },
    });

    return { shortCode };
  }

  async getLongUrl(shortCode: string) {
    const url = await this.prisma.url.findUnique({
      where: { shortCode },
    });

    if (!url) {
      throw new Error('URL not found');
    }

    // Increment click count
    await this.prisma.url.update({
      where: { id: url.id },
      data: { clicks: url.clicks + 1 },
    });

    return url.longUrl;
  }

  async getAnalytics(shortCode: string) {
    const url = await this.prisma.url.findUnique({
      where: { shortCode },
    });

    if (!url) {
      throw new Error('URL not found');
    }

    return {
      shortCode: url.shortCode,
      longUrl: url.longUrl,
      clicks: url.clicks,
      createdAt: url.createdAt,
    };
  }

  private generateShortCode(): string {
    return Math.random().toString(36).substring(2, 8);
  }
}