import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class CreatePolicyDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  quoteId: string;
}
