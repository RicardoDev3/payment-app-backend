import { Result } from './result';

describe('Result', () => {
  describe('success', () => {
    it('should create a successful result', () => {
      const result = Result.success('test value');

      expect(result.isSuccess).toBe(true);
      expect(result.isFailure).toBe(false);
      expect(result.value).toBe('test value');
    });

    it('should work with objects', () => {
      const data = { id: 1, name: 'Test' };
      const result = Result.success(data);

      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual(data);
    });

    it('should work with null', () => {
      const result = Result.success(null);

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeNull();
    });
  });

  describe('failure', () => {
    it('should create a failed result', () => {
      const error = new Error('Test error');
      const result = Result.failure(error);

      expect(result.isSuccess).toBe(false);
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe(error);
    });

    it('should work with custom errors', () => {
      class CustomError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'CustomError';
        }
      }

      const error = new CustomError('Custom error message');
      const result = Result.failure(error);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(CustomError);
      expect(result.error.message).toBe('Custom error message');
    });
  });

  describe('value getter', () => {
    it('should return value when result is successful', () => {
      const result = Result.success('test');
      expect(result.value).toBe('test');
    });

    it('should throw error when trying to get value from failure', () => {
      const result = Result.failure(new Error('Failed'));
      expect(() => result.value).toThrow('Cannot get value from a failure result');
    });
  });

  describe('error getter', () => {
    it('should return error when result is failure', () => {
      const error = new Error('Test error');
      const result = Result.failure(error);
      expect(result.error).toBe(error);
    });

    it('should throw error when trying to get error from success', () => {
      const result = Result.success('test');
      expect(() => result.error).toThrow('Cannot get error from a success result');
    });
  });
});
