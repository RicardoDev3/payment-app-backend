/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { AxiosResponse, AxiosError } from 'axios';
import { WompiClient } from './wompi.client';

describe('WompiClient', () => {
  let wompiClient: WompiClient;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const mockHttpService = {
      post: jest.fn(),
      get: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn((key: string) => {
        const config = {
          WOMPI_BASE_URL: 'https://api-sandbox.co.uat.wompi.dev/v1',
          WOMPI_PUBLIC_KEY: 'pub_test_123',
          WOMPI_PRIVATE_KEY: 'prv_test_456',
          WOMPI_INTEGRITY_KEY: 'integrity_test_789',
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [WompiClient, { provide: HttpService, useValue: mockHttpService }, { provide: ConfigService, useValue: mockConfigService }],
    }).compile();

    wompiClient = module.get<WompiClient>(WompiClient);
    httpService = module.get(HttpService);
    configService = module.get(ConfigService);
  });

  it('should be defined', () => {
    expect(wompiClient).toBeDefined();
  });

  describe('tokenizeCard', () => {
    const cardData = {
      number: '4242424242424242',
      cvc: '123',
      exp_month: '12',
      exp_year: '25',
      card_holder: 'John Doe',
    };

    it('should tokenize card successfully', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          data: {
            id: 'tok_test_123',
            created_at: '2024-01-01',
            brand: 'VISA',
            name: 'VISA-4242',
            last_four: '4242',
            bin: '424242',
            exp_year: '25',
            exp_month: '12',
            card_holder: 'John Doe',
            expires_at: '2025-12-31',
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpService.post.mockReturnValue(of(mockResponse));

      const result = await wompiClient.tokenizeCard(cardData);

      expect(result.data.id).toBe('tok_test_123');
      expect(result.data.brand).toBe('VISA');
      expect(httpService.post).toHaveBeenCalledWith(
        'https://api-sandbox.co.uat.wompi.dev/v1/tokens/cards',
        cardData,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer pub_test_123',
          }),
        }),
      );
    });

    it('should throw error when tokenization fails', async () => {
      const errorResponse = {
        response: {
          data: {
            error: {
              reason: 'Invalid card number',
            },
          },
        },
      };

      httpService.post.mockReturnValue(throwError(() => errorResponse as AxiosError));

      await expect(wompiClient.tokenizeCard(cardData)).rejects.toThrow('Failed to tokenize card');
    });

    it('should handle generic error', async () => {
      const error = new Error('Network error');
      httpService.post.mockReturnValue(throwError(() => error));

      await expect(wompiClient.tokenizeCard(cardData)).rejects.toThrow('Failed to tokenize card');
    });
  });

  describe('createTransaction', () => {
    const paymentData = {
      amount_in_cents: 100000,
      currency: 'COP',
      customer_email: 'test@example.com',
      payment_method: {
        type: 'CARD',
        token: 'tok_test_123',
      },
      reference: 'TXN-123',
    };

    it('should create transaction successfully', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          data: {
            id: 'wompi-txn-123',
            created_at: '2024-01-01',
            amount_in_cents: 100000,
            reference: 'TXN-123',
            currency: 'COP',
            payment_method_type: 'CARD',
            payment_method: {},
            status: 'APPROVED',
            status_message: 'Approved',
            customer_email: 'test@example.com',
            customer_data: {},
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpService.post.mockReturnValue(of(mockResponse));

      const result = await wompiClient.createTransaction(paymentData);

      expect(result.data.id).toBe('wompi-txn-123');
      expect(result.data.status).toBe('APPROVED');
      expect(httpService.post).toHaveBeenCalledWith(
        'https://api-sandbox.co.uat.wompi.dev/v1/transactions',
        expect.objectContaining({
          ...paymentData,
          signature: expect.objectContaining({
            integrity: expect.any(String),
          }),
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer prv_test_456',
          }),
        }),
      );
    });

    it('should throw error when transaction creation fails', async () => {
      const errorResponse = {
        response: {
          data: {
            error: {
              reason: 'Payment declined',
            },
          },
        },
      };

      httpService.post.mockReturnValue(throwError(() => errorResponse as AxiosError));

      await expect(wompiClient.createTransaction(paymentData)).rejects.toThrow('Failed to create transaction');
    });

    it('should handle generic error', async () => {
      const error = new Error('Network error');
      httpService.post.mockReturnValue(throwError(() => error));

      await expect(wompiClient.createTransaction(paymentData)).rejects.toThrow('Failed to create transaction');
    });
  });

  describe('getTransaction', () => {
    it('should get transaction successfully', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          data: {
            id: 'wompi-txn-123',
            created_at: '2024-01-01',
            amount_in_cents: 100000,
            reference: 'TXN-123',
            currency: 'COP',
            payment_method_type: 'CARD',
            payment_method: {},
            status: 'APPROVED',
            status_message: 'Approved',
            customer_email: 'test@example.com',
            customer_data: {},
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpService.get.mockReturnValue(of(mockResponse));

      const result = await wompiClient.getTransaction('wompi-txn-123');

      expect(result.data.id).toBe('wompi-txn-123');
      expect(httpService.get).toHaveBeenCalledWith(
        'https://api-sandbox.co.uat.wompi.dev/v1/transactions/wompi-txn-123',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer pub_test_123',
          }),
        }),
      );
    });

    it('should throw error when get transaction fails', async () => {
      const error = new Error('Transaction not found');
      httpService.get.mockReturnValue(throwError(() => error));

      await expect(wompiClient.getTransaction('non-existent')).rejects.toThrow('Failed to get transaction');
    });
  });

  describe('detectCardType', () => {
    it('should detect VISA card', () => {
      expect(wompiClient.detectCardType('4242424242424242')).toBe('VISA');
      expect(wompiClient.detectCardType('4111111111111111')).toBe('VISA');
    });

    it('should detect MASTERCARD', () => {
      expect(wompiClient.detectCardType('5555555555554444')).toBe('MASTERCARD');
      expect(wompiClient.detectCardType('5105105105105100')).toBe('MASTERCARD');
      expect(wompiClient.detectCardType('2221000000000009')).toBe('MASTERCARD');
    });

    it('should return UNKNOWN for unrecognized cards', () => {
      expect(wompiClient.detectCardType('1234567890123456')).toBe('UNKNOWN');
      expect(wompiClient.detectCardType('0000000000000000')).toBe('UNKNOWN');
    });

    it('should handle card numbers with spaces', () => {
      expect(wompiClient.detectCardType('4242 4242 4242 4242')).toBe('VISA');
      expect(wompiClient.detectCardType('5555 5555 5555 4444')).toBe('MASTERCARD');
    });
  });
});
