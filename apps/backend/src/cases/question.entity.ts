import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Case } from './case.entity';

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Case, (c) => c.questions)
  case: Case;

  @Column()
  caseId: string;

  @Column()
  order: number;

  @Column({ type: 'text' })
  text: string;

  @Column({ type: 'varchar', default: 'multiple_choice' })
  type: 'multiple_choice' | 'open' | 'verdict';

  @Column({ type: 'jsonb', nullable: true })
  options: string[] | null;

  @Column({ type: 'text' })
  correctAnswer: string;

  @Column({ default: 20 })
  points: number;

  @CreateDateColumn()
  createdAt: Date;
}
