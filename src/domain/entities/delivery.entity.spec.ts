import { Delivery } from './delivery.entity';
import { Address } from '../../shared/types';

describe('Delivery Entity', () => {
  let delivery: Delivery;
  let address: Address;

  beforeEach(() => {
    address = {
      street: 'Calle 123',
      city: 'Medellín',
      state: 'Antioquia',
      zipCode: '050001',
      country: 'Colombia',
    };

    delivery = new Delivery('delivery-id', 'transaction-id', 'customer-id', address, 'Leave at door', new Date('2024-01-10'), new Date('2024-01-01'));
  });

  describe('constructor', () => {
    it('should create a delivery with all properties', () => {
      expect(delivery.id).toBe('delivery-id');
      expect(delivery.transactionId).toBe('transaction-id');
      expect(delivery.customerId).toBe('customer-id');
      expect(delivery.address).toEqual(address);
      expect(delivery.deliveryNotes).toBe('Leave at door');
    });
  });

  describe('updateAddress', () => {
    it('should update address', () => {
      const newAddress: Address = {
        street: 'Carrera 456',
        city: 'Bogotá',
        state: 'Cundinamarca',
        zipCode: '110111',
        country: 'Colombia',
      };

      delivery.updateAddress(newAddress);
      expect(delivery.address).toEqual(newAddress);
    });
  });

  describe('updateEstimatedDelivery', () => {
    it('should update estimated delivery date', () => {
      const newDate = new Date('2024-01-15');
      delivery.updateEstimatedDelivery(newDate);
      expect(delivery.estimatedDeliveryDate).toEqual(newDate);
    });
  });

  describe('toJSON', () => {
    it('should return proper JSON representation', () => {
      const json = delivery.toJSON();

      expect(json).toHaveProperty('id', 'delivery-id');
      expect(json).toHaveProperty('transactionId', 'transaction-id');
      expect(json).toHaveProperty('customerId', 'customer-id');
      expect(json).toHaveProperty('address');
      expect(json).toHaveProperty('deliveryNotes', 'Leave at door');
      expect(json).toHaveProperty('estimatedDeliveryDate');
      expect(json).toHaveProperty('createdAt');
    });
  });
});
