import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lesson } from './lesson.entity';

@Injectable()
export class LessonsService {
  constructor(@InjectRepository(Lesson) private lessons: Repository<Lesson>) {}

  findByRoom(roomId: string) {
    return this.lessons.find({ where: { roomId }, order: { order: 'ASC' } });
  }

  async findOne(id: string) {
    const lesson = await this.lessons.findOne({ where: { id } });
    if (!lesson) throw new NotFoundException('שיעור לא נמצא');
    return lesson;
  }
}
