import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { Room } from '../rooms/room.entity';
import { Case } from '../cases/case.entity';

@Entity('lessons')
export class Lesson {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Room, (r) => r.lessons)
  room: Room;

  @Column()
  roomId: string;

  @Column()
  order: number;

  @Column()
  title: string;

  @Column({ type: 'text', default: '' })
  content: string;

  @Column({ type: 'text', nullable: true })
  sourceContent: string | null;

  @Column({ nullable: true })
  videoUrl: string;

  @OneToMany(() => Case, (c) => c.lesson)
  cases: Case[];

  @CreateDateColumn()
  createdAt: Date;
}
