import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('classes')
export class ClassRoom {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  teacherId: string;

  @Column({ unique: true })
  code: string;

  @Column({ default: '' })
  school: string;

  @CreateDateColumn()
  createdAt: Date;
}
