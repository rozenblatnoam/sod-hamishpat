import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassRoom } from './class.entity';
import { ClassesController } from './classes.controller';
import { ClassesService } from './classes.service';
import { User } from '../users/user.entity';
import { Progress } from '../progress/progress.entity';
import { Room } from '../rooms/room.entity';
import { Lesson } from '../lessons/lesson.entity';
import { Case } from '../cases/case.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ClassRoom, User, Progress, Room, Lesson, Case])],
  controllers: [ClassesController],
  providers: [ClassesService],
  exports: [ClassesService],
})
export class ClassesModule {}
