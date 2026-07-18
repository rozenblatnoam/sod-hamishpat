import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserLevel } from '../shared/constants';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column({ default: '' })
  school: string;

  @Column({ default: '' })
  class: string;

  @Column({ type: 'varchar', default: 'student' })
  level: UserLevel;

  @Column({ default: 0 })
  score: number;

  @Column({ type: 'varchar', default: 'student' })
  role: 'student' | 'teacher' | 'admin';

  @Column({ type: 'varchar', nullable: true, default: null })
  classCode: string | null;

  @Column({ nullable: true })
  firebaseUid: string;

  @Column({ type: 'jsonb', nullable: true, default: null })
  scormProgress: {
    completedCases: string[];
    completedRooms: string[];
    score: number;
    syncedAt: string;
  } | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
