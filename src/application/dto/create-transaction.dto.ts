import { IsNotEmpty, IsString, IsNumber, Min, ValidateNested, Matches } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateCustomerDto } from './create-customer.dto';
import { CreateDeliveryDto } from './create-delivery.dto';

class CreditCardDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{13,19}$/, {
    message: 'Card number must be between 13 and 19 digits',
  })
  number: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{3,4}$/, {
    message: 'CVC must be 3 or 4 digits',
  })
  cvc: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^(0[1-9]|1[0-2])$/, {
    message: 'Expiration month must be between 01 and 12',
  })
  expMonth: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{2}$/, {
    message: 'Expiration year must be 2 digits',
  })
  expYear: string;

  @IsString()
  @IsNotEmpty()
  cardHolder: string;
}

export class CreateTransactionDto {
  @IsString()
  @IsNotEmpty({ message: 'Product ID is required' })
  productId: string;

  @IsNumber()
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity: number;

  @ValidateNested()
  @Type(() => CreateCustomerDto)
  customer: CreateCustomerDto;

  @ValidateNested()
  @Type(() => CreditCardDto)
  creditCard: CreditCardDto;

  @ValidateNested()
  @Type(() => CreateDeliveryDto)
  delivery: CreateDeliveryDto;
}
