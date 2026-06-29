import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Room } from '../rooms/room.entity';

@Entity('user_progress')
@Unique(['userId', 'roomId'])
export class Progress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  user: User;

  @Column()
  roomId: string;

  @ManyToOne(() => Room)
  room: Room;

  @Column({ nullable: true })
  lessonId: string;

  @Column({ type: 'jsonb', default: [] })
  completedQuestions: string[];

  @Column({ default: 0 })
  score: number;

  @Column({ nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
