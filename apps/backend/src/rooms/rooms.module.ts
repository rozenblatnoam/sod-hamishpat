import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
import { Room } from './room.entity';
import { Lesson } from '../lessons/lesson.entity';
import { Case } from '../cases/case.entity';
import { Progress } from '../progress/progress.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Room, Lesson, Case, Progress])],
  controllers: [RoomsController],
  providers: [RoomsService],
  exports: [RoomsService],
})
export class RoomsModule {}
