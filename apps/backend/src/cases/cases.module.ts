import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CasesController } from './cases.controller';
import { CasesService } from './cases.service';
import { Case } from './case.entity';
import { Question } from './question.entity';
import { Progress } from '../progress/progress.entity';
import { User } from '../users/user.entity';
import { Lesson } from '../lessons/lesson.entity';
import { Room } from '../rooms/room.entity';
import { Achievement } from '../achievements/achievement.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Case, Question, Progress, User, Lesson, Room, Achievement])],
  controllers: [CasesController],
  providers: [CasesService],
})
export class CasesModule {}
