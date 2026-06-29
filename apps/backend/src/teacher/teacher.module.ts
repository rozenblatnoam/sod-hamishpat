import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeacherController } from './teacher.controller';
import { TeacherService } from './teacher.service';
import { User } from '../users/user.entity';
import { Progress } from '../progress/progress.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Progress])],
  controllers: [TeacherController],
  providers: [TeacherService],
})
export class TeacherModule {}
