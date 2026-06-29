import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AiService } from './ai.service';

class AskDto {
  @IsNotEmpty() @IsString() question: string;
  @IsString() context: string;
}

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private ai: AiService) {}

  @Post('ask')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async ask(@Body() dto: AskDto) {
    const answer = await this.ai.ask(dto.question, dto.context);
    return { answer };
  }
}
