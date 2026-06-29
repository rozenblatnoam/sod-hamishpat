import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { Lesson } from '../lessons/lesson.entity';

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  order: number;

  @Column()
  title: string;

  @Column()
  titleHe: string;

  @Column({ type: 'text', default: '' })
  description: string;

  @Column()
  topic: string;

  @Column({ default: false })
  isLocked: boolean;

  @OneToMany(() => Lesson, (l) => l.room)
  lessons: Lesson[];

  @CreateDateColumn()
  createdAt: Date;
}
