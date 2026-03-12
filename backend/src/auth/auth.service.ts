import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    this.logger.log(`Registering user: email=${dto.email}`);
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const emailLower = dto.email.toLowerCase();

    try {
      const user = await this.prisma.user.create({
        data: {
          email: emailLower,
          password: hashedPassword,
          name: dto.name,
        },
      });

      const payload = { sub: user.id, email: user.email };
      const accessToken = this.jwtService.sign(payload);

      return {
        accessToken,
        tokenType: 'Bearer',
      };
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Email already registered');
      }
      throw error;
    }
  }

  async login(dto: LoginDto) {
    this.logger.log(`Login attempt: email=${dto.email}`);
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password);

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);
    this.logger.log(`Login successful: email=${dto.email}`);
    return {
      accessToken,
      tokenType: 'Bearer',
    };
  }
}
