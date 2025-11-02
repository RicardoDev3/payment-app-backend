import { Product } from './product.entity';

describe('Product Entity', () => {
  let product: Product;

  beforeEach(() => {
    product = new Product('test-id', 'Test Product', 'Test Description', 100000, 10, 'https://example.com/image.jpg', new Date('2024-01-01'), new Date('2024-01-01'));
  });

  describe('hasStock', () => {
    it('should return true when stock is sufficient', () => {
      expect(product.hasStock(5)).toBe(true);
    });

    it('should return true when stock equals requested quantity', () => {
      expect(product.hasStock(10)).toBe(true);
    });

    it('should return false when stock is insufficient', () => {
      expect(product.hasStock(11)).toBe(false);
    });

    it('should check for 1 unit by default', () => {
      expect(product.hasStock()).toBe(true);
    });
  });

  describe('reduceStock', () => {
    it('should reduce stock by specified quantity', () => {
      const initialStock = product.stock;
      product.reduceStock(3);
      expect(product.stock).toBe(initialStock - 3);
    });

    it('should update updatedAt timestamp', () => {
      const initialDate = product.updatedAt;
      setTimeout(() => {
        product.reduceStock(1);
        expect(product.updatedAt.getTime()).toBeGreaterThan(initialDate.getTime());
      }, 10);
    });

    it('should throw error when insufficient stock', () => {
      expect(() => product.reduceStock(11)).toThrow('Insufficient stock');
    });
  });

  describe('increaseStock', () => {
    it('should increase stock by specified quantity', () => {
      const initialStock = product.stock;
      product.increaseStock(5);
      expect(product.stock).toBe(initialStock + 5);
    });

    it('should update updatedAt timestamp', () => {
      const initialDate = product.updatedAt;
      setTimeout(() => {
        product.increaseStock(5);
        expect(product.updatedAt.getTime()).toBeGreaterThan(initialDate.getTime());
      }, 10);
    });
  });

  describe('updatePrice', () => {
    it('should update price successfully', () => {
      product.updatePrice(200000);
      expect(product.price).toBe(200000);
    });

    it('should update updatedAt timestamp', () => {
      const initialDate = product.updatedAt;
      setTimeout(() => {
        product.updatePrice(150000);
        expect(product.updatedAt.getTime()).toBeGreaterThan(initialDate.getTime());
      }, 10);
    });

    it('should throw error when price is negative', () => {
      expect(() => product.updatePrice(-100)).toThrow('Price cannot be negative');
    });
  });

  describe('toJSON', () => {
    it('should return proper JSON representation', () => {
      const json = product.toJSON();
      expect(json).toHaveProperty('id', 'test-id');
      expect(json).toHaveProperty('name', 'Test Product');
      expect(json).toHaveProperty('description', 'Test Description');
      expect(json).toHaveProperty('price', 100000);
      expect(json).toHaveProperty('stock', 10);
      expect(json).toHaveProperty('imageUrl');
      expect(json).toHaveProperty('createdAt');
      expect(json).toHaveProperty('updatedAt');
    });
  });
});
