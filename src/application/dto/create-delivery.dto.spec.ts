import { CreateDeliveryDto } from './create-delivery.dto';
import { validateDto } from './test-helpers';

describe('CreateDeliveryDto', () => {
  it('should validate correct delivery data', async () => {
    const validData = {
      address: {
        street: 'Calle 123',
        city: 'Medellín',
        state: 'Antioquia',
        zipCode: '050001',
        country: 'Colombia',
      },
      deliveryNotes: 'Leave at door',
    };

    const errors = await validateDto(CreateDeliveryDto, validData);
    expect(errors.length).toBe(0);
  });

  it('should validate without delivery notes (optional)', async () => {
    const validData = {
      address: {
        street: 'Calle 123',
        city: 'Medellín',
        state: 'Antioquia',
        zipCode: '050001',
        country: 'Colombia',
      },
    };

    const errors = await validateDto(CreateDeliveryDto, validData);
    expect(errors.length).toBe(0);
  });

  it('should fail with missing address', async () => {
    const invalidData = {
      deliveryNotes: 'Leave at door',
    };

    const errors = await validateDto(CreateDeliveryDto, invalidData);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with incomplete address', async () => {
    const invalidData = {
      address: {
        street: 'Calle 123',
        city: 'Medellín',
        // Faltan campos
      },
      deliveryNotes: 'Leave at door',
    };

    const errors = await validateDto(CreateDeliveryDto, invalidData);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with empty address fields', async () => {
    const invalidData = {
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
      },
    };

    const errors = await validateDto(CreateDeliveryDto, invalidData);
    expect(errors.length).toBeGreaterThan(0);
  });
});
