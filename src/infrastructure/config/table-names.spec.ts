import { TABLE_NAMES } from './table-names';

describe('Table Names', () => {
  it('should have Products table name', () => {
    expect(TABLE_NAMES.PRODUCTS).toBe('Products');
  });

  it('should have Customers table name', () => {
    expect(TABLE_NAMES.CUSTOMERS).toBe('Customers');
  });

  it('should have Transactions table name', () => {
    expect(TABLE_NAMES.TRANSACTIONS).toBe('Transactions');
  });

  it('should have Deliveries table name', () => {
    expect(TABLE_NAMES.DELIVERIES).toBe('Deliveries');
  });

  it('should have all required table names', () => {
    expect(Object.keys(TABLE_NAMES)).toHaveLength(4);
    expect(TABLE_NAMES).toHaveProperty('PRODUCTS');
    expect(TABLE_NAMES).toHaveProperty('CUSTOMERS');
    expect(TABLE_NAMES).toHaveProperty('TRANSACTIONS');
    expect(TABLE_NAMES).toHaveProperty('DELIVERIES');
  });
});
