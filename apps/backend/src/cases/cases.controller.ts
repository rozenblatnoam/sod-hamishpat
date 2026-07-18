import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { IsNotEmpty, IsIn, IsOptional, IsNumber } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CasesService } from './cases.service';

class VerdictDto {
  @IsIn(['liable', 'exempt', 'partially_liable']) verdict!: string;
  @IsNotEmpty() reasoning!: string;
  @IsOptional() @IsNumber() hintsUsed?: number;
}

@ApiTags('cases')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class CasesController {
  constructor(private cases: CasesService) {}

  @Get('lessons/:lessonId/cases')
  findByLesson(@Param('lessonId') lessonId: string) {
    return this.cases.findByLesson(lessonId);
  }

  @Post('cases/:id/verdict')
  submitVerdict(
    @Param('id') id: string,
    @Body() dto: VerdictDto,
    @CurrentUser() user: any,
  ) {
    return this.cases.submitVerdict(id, user.id, dto.verdict, dto.reasoning, dto.hintsUsed);
  }
}
