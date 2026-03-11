import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePolicyDto } from './dto/create-policy.dto';

@Injectable()
export class PoliciesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePolicyDto, userId: string) {
    const policy = await this.prisma.$transaction(async (tx) => {
      const quote = await tx.quote.findUnique({
        where: { id: dto.quoteId },
        include: { policy: true },
      });

      if (!quote) {
        throw new NotFoundException(`Quote '${dto.quoteId}' not found`);
      }

      if (quote.status !== 'QUOTED') {
        throw new BadRequestException('Quote has already been issued');
      }

      if (quote.policy) {
        throw new ConflictException('A policy already exists for this quote');
      }

      await tx.quote.update({
        where: { id: dto.quoteId },
        data: { status: 'ISSUED' },
      });

      return tx.policy.create({
        data: {
          quoteId: dto.quoteId,
          userId,
        },
      });
    });

    return this.formatPolicy(policy);
  }

  async findOne(id: string, userId: string) {
    const policy = await this.prisma.policy.findUnique({
      where: { id },
    });

    if (!policy) {
      throw new NotFoundException(`Policy '${id}' not found`);
    }

    if (policy.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.formatPolicy(policy);
  }

  private formatPolicy(policy: any) {
    return {
      id: policy.id,
      quoteId: policy.quoteId,
      status: policy.status,
      issuedAt: policy.issuedAt,
    };
  }
}
