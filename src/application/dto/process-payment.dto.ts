import { IsNotEmpty, IsString } from 'class-validator';

export class ProcessPaymentDto {
  @IsString()
  @IsNotEmpty()
  transactionId: string;
}
