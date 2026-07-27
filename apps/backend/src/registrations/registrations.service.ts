import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { Registration } from './registration.entity';
import { User } from '../users/user.entity';

@Injectable()
export class RegistrationsService {
  constructor(
    @InjectRepository(Registration) private registrations: Repository<Registration>,
    @InjectRepository(User) private users: Repository<User>,
    private jwt: JwtService,
  ) {}

  async register(dto: { name: string; phone: string; email: string; marketingConsent: boolean }) {
    const reg = this.registrations.create(dto);
    await this.registrations.save(reg);

    let user = await this.users.findOne({ where: { email: dto.email } });
    if (!user) {
      user = this.users.create({
        name: dto.name,
        email: dto.email,
        passwordHash: '',
        school: '',
        role: 'student',
      });
      await this.users.save(user);
    }

    const token = this.jwt.sign({ sub: user.id, email: user.email });
    const { passwordHash: _pw, ...safeUser } = user;
    return { token, user: safeUser };
  }
}
