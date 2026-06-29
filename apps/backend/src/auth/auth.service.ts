import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    private jwt: JwtService,
  ) {}

  async register(dto: {
    name: string;
    email: string;
    password: string;
    school: string;
    class?: string;
    role?: 'student' | 'teacher';
  }) {
    const exists = await this.users.findOne({ where: { email: dto.email } });
    if (exists) throw new ConflictException('אימייל כבר קיים');

    const hash = await bcrypt.hash(dto.password, 10);
    const user = this.users.create({
      name: dto.name,
      email: dto.email,
      passwordHash: hash,
      school: dto.school,
      class: dto.class,
      role: dto.role ?? 'student',
    });
    await this.users.save(user);

    const token = this.jwt.sign({ sub: user.id, email: user.email });
    return { token, user: this.sanitize(user) };
  }

  async login(email: string, password: string) {
    const user = await this.users.findOne({ where: { email } });
    if (!user) throw new UnauthorizedException('פרטים שגויים');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('פרטים שגויים');

    const token = this.jwt.sign({ sub: user.id, email: user.email });
    return { token, user: this.sanitize(user) };
  }

  async findById(id: string) {
    return this.users.findOne({ where: { id } });
  }

  sanitize(user: User) {
    const { passwordHash, ...rest } = user as any;
    return rest;
  }
}
