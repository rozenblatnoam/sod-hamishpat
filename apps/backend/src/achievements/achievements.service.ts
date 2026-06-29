import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Achievement } from './achievement.entity';

@Injectable()
export class AchievementsService {
  constructor(
    @InjectRepository(Achievement) private achievements: Repository<Achievement>,
  ) {}

  findAll() {
    return this.achievements.find();
  }

  findUserAchievements(userId: string) {
    return this.achievements
      .createQueryBuilder('a')
      .innerJoin('a.users', 'u', 'u.id = :userId', { userId })
      .getMany();
  }
}
