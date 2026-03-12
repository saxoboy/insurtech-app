import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { CatalogsService } from './catalogs.service';

@Controller('catalogs')
export class CatalogsController {
  constructor(private readonly catalogsService: CatalogsService) {}

  @Get('insurance-types')
  getInsuranceTypes() {
    return this.catalogsService.getInsuranceTypes();
  }

  @Get('coverages')
  getCoverages(@Query('insuranceType') insuranceType: string) {
    if (!insuranceType) {
      throw new BadRequestException(
        'insuranceType query parameter is required',
      );
    }
    return this.catalogsService.getCoverages(insuranceType);
  }

  @Get('locations')
  getLocations() {
    return this.catalogsService.getLocations();
  }
}
