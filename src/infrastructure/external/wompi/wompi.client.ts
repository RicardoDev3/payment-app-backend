import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';

export interface WompiPaymentRequest {
  amount_in_cents: number;
  currency: string;
  customer_email: string;
  payment_method: {
    type: string;
    token: string;
  };
  reference: string;
  customer_data?: {
    phone_number: string;
    full_name: string;
  };
}

export interface WompiTokenizeCardRequest {
  number: string;
  cvc: string;
  exp_month: string;
  exp_year: string;
  card_holder: string;
}

export interface WompiTokenizeCardResponse {
  data: {
    id: string;
    created_at: string;
    brand: string;
    name: string;
    last_four: string;
    bin: string;
    exp_year: string;
    exp_month: string;
    card_holder: string;
    expires_at: string;
  };
}

export interface WompiPaymentResponse {
  data: {
    id: string;
    created_at: string;
    amount_in_cents: number;
    reference: string;
    currency: string;
    payment_method_type: string;
    payment_method: any;
    status: string;
    status_message: string;
    customer_email: string;
    customer_data: any;
  };
}

@Injectable()
export class WompiClient {
  private readonly baseUrl: string;
  private readonly publicKey: string;
  private readonly privateKey: string;
  private readonly integrityKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>('WOMPI_BASE_URL') ?? '';
    this.publicKey = this.configService.get<string>('WOMPI_PUBLIC_KEY') ?? '';
    this.privateKey = this.configService.get<string>('WOMPI_PRIVATE_KEY') ?? '';
    this.integrityKey = this.configService.get<string>('WOMPI_INTEGRITY_KEY') ?? '';
  }

  /**
   * Tokeniza una tarjeta de crédito
   * Convierte los datos sensibles de la tarjeta en un token seguro
   */
  async tokenizeCard(cardData: WompiTokenizeCardRequest): Promise<WompiTokenizeCardResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<WompiTokenizeCardResponse>(`${this.baseUrl}/tokens/cards`, cardData, {
          headers: {
            Authorization: `Bearer ${this.publicKey}`,
            'Content-Type': 'application/json',
          },
        }),
      );

      return response.data;
    } catch (error) {
      console.error('Error tokenizing card:', error.response?.data || error.message);
      throw new Error(`Failed to tokenize card: ${error.response?.data?.error?.reason || error.message}`);
    }
  }

  /**
   * Procesa un pago con Wompi
   */
  async createTransaction(paymentData: WompiPaymentRequest): Promise<WompiPaymentResponse> {
    try {
      // Generar firma de integridad
      const signature = this.generateIntegritySignature(paymentData.reference, paymentData.amount_in_cents, paymentData.currency);

      const response = await firstValueFrom(
        this.httpService.post<WompiPaymentResponse>(
          `${this.baseUrl}/transactions`,
          {
            ...paymentData,
            signature: {
              integrity: signature,
            },
          },
          {
            headers: {
              Authorization: `Bearer ${this.privateKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      return response.data;
    } catch (error) {
      console.error('Error creating transaction:', error.response?.data || error.message);
      throw new Error(`Failed to create transaction: ${error.response?.data?.error?.reason || error.message}`);
    }
  }

  /**
   * Consulta el estado de una transacción
   */
  async getTransaction(transactionId: string): Promise<WompiPaymentResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<WompiPaymentResponse>(`${this.baseUrl}/transactions/${transactionId}`, {
          headers: {
            Authorization: `Bearer ${this.publicKey}`,
          },
        }),
      );

      return response.data;
    } catch (error) {
      console.error('Error getting transaction:', error.response?.data || error.message);
      throw new Error(`Failed to get transaction: ${error.message}`);
    }
  }

  /**
   * Genera la firma de integridad requerida por Wompi
   * Esta firma asegura que la transacción no ha sido modificada
   */
  private generateIntegritySignature(reference: string, amountInCents: number, currency: string): string {
    const concatenatedString = `${reference}${amountInCents}${currency}${this.integrityKey}`;

    return crypto.createHash('sha256').update(concatenatedString).digest('hex');
  }

  /**
   * Valida el tipo de tarjeta basándose en el número
   */
  detectCardType(cardNumber: string): 'VISA' | 'MASTERCARD' | 'UNKNOWN' {
    const cleanNumber = cardNumber.replace(/\s/g, '');

    // VISA empieza con 4
    if (/^4/.test(cleanNumber)) {
      return 'VISA';
    }

    // MASTERCARD empieza con 51-55 o 2221-2720
    if (/^5[1-5]/.test(cleanNumber) || /^2(2[2-9][0-9]|[3-6][0-9]{2}|7[0-1][0-9]|720)/.test(cleanNumber)) {
      return 'MASTERCARD';
    }

    return 'UNKNOWN';
  }
}
