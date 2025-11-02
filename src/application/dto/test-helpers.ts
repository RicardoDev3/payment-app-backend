import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

export async function validateDto(dtoClass: any, data: any) {
  const dtoInstance = plainToInstance(dtoClass, data);
  const errors = await validate(dtoInstance);
  return errors;
}
