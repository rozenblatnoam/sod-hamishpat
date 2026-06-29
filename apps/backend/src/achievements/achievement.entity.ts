import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('achievements')
export class Achievement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  titleHe: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  icon: string;

  @Column()
  condition: string;

  @ManyToMany(() => User)
  @JoinTable({ name: 'user_achievements' })
  users: User[];

  @CreateDateColumn()
  createdAt: Date;
}
