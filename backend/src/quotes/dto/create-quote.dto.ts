import { IsString, IsInt, Min, Max, IsNotEmpty } from 'class-validator';

export class CreateQuoteDto {
  @IsString()
  @IsNotEmpty()
  insuranceType: string;

  @IsString()
  @IsNotEmpty()
  coverage: string;

  @IsInt()
  @Min(18)
  @Max(100)
  age: number;

  @IsString()
  @IsNotEmpty()
  location: string;
}
