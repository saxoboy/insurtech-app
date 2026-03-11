import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePolicyDto } from './dto/create-policy.dto';

@Injectable()
export class PoliciesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePolicyDto, userId: string) {
    const quote = await this.prisma.quote.findUnique({
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

    // Crear póliza y actualizar estado del quote en una transacción
    const policy = await this.prisma.$transaction(async (tx) => {
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

  async findOne(id: string) {
    const policy = await this.prisma.policy.findUnique({
      where: { id },
    });

    if (!policy) {
      throw new NotFoundException(`Policy '${id}' not found`);
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
