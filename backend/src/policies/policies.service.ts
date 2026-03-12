import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePolicyDto } from './dto/create-policy.dto';

@Injectable()
export class PoliciesService {
  private readonly logger = new Logger(PoliciesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePolicyDto, userId: string) {
    this.logger.log(`Issuing policy: quoteId=${dto.quoteId} userId=${userId}`);
    const policy = await this.prisma.$transaction(async (tx) => {
      const quote = await tx.quote.findUnique({
        where: { id: dto.quoteId },
        include: { policy: true },
      });

      if (!quote) {
        throw new NotFoundException(`Quote '${dto.quoteId}' not found`);
      }

      if (quote.status !== 'QUOTED') {
        throw new BadRequestException(
          `Quote is not in a valid state for this operation (current: ${quote.status})`,
        );
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

    this.logger.log(`Policy issued: id=${policy.id} quoteId=${dto.quoteId}`);
    return this.formatPolicy(policy);
  }

  async findOne(id: string, userId: string) {
    const policy = await this.prisma.policy.findUnique({
      where: { id },
      include: { quote: true },
    });

    if (!policy) {
      throw new NotFoundException(`Policy '${id}' not found`);
    }

    if (policy.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.formatPolicy(policy);
  }

  async findAllByUser(userId: string) {
    const policies = await this.prisma.policy.findMany({
      where: { userId },
      include: { quote: true },
      orderBy: { issuedAt: 'desc' },
    });

    return {
      items: policies.map((p) => this.formatPolicy(p)),
    };
  }

  private formatPolicy(policy: any) {
    return {
      id: policy.id,
      quoteId: policy.quoteId,
      status: policy.status,
      issuedAt: policy.issuedAt,
      quote: policy.quote
        ? {
            insuranceTypeCode: policy.quote.insuranceTypeCode,
            coverageCode: policy.quote.coverageCode,
            estimatedPremium: policy.quote.estimatedPremium,
          }
        : undefined,
    };
  }
}
