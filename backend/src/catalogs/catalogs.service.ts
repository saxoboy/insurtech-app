import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CatalogsService {
  constructor(private readonly prisma: PrismaService) {}

  async getInsuranceTypes() {
    const types = await this.prisma.insuranceType.findMany({
      orderBy: { name: 'asc' },
    });
    return {
      items: types.map(({ code, name }) => ({ code, name })),
    };
  }

  async getCoverages(insuranceType: string) {
    const coverages = await this.prisma.coverage.findMany({
      where: {
        insuranceType: { code: insuranceType },
      },
      orderBy: { name: 'asc' },
    });
    return {
      items: coverages.map(({ code, name }) => ({ code, name })),
    };
  }

  async getLocations() {
    const locations = await this.prisma.location.findMany({
      orderBy: { name: 'asc' },
    });
    return {
      items: locations.map(({ code, name }) => ({ code, name })),
    };
  }
}
