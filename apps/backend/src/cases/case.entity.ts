import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { Lesson } from '../lessons/lesson.entity';
import { Question } from '../cases/question.entity';
import { VerdictOption } from '../shared/constants';

@Entity('cases')
export class Case {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Lesson, (l) => l.cases)
  lesson: Lesson;

  @Column()
  lessonId: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  scenario: string;

  @Column({ type: 'varchar' })
  verdict: VerdictOption;

  @Column({ type: 'text' })
  explanation: string;

  @OneToMany(() => Question, (q) => q.case)
  questions: Question[];

  @CreateDateColumn()
  createdAt: Date;
}
