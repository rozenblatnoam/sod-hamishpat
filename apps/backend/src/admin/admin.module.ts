import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../users/user.entity';
import { Room } from '../rooms/room.entity';
import { Progress } from '../progress/progress.entity';
import { ClassRoom } from '../classes/class.entity';
import { Registration } from '../registrations/registration.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Room, Progress, ClassRoom, Registration])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
