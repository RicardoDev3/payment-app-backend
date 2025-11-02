export class Customer {
  constructor(
    public readonly id: string,
    public email: string,
    public fullName: string,
    public phoneNumber: string,
    public createdAt: Date,
  ) {}

  toJSON() {
    return {
      id: this.id,
      email: this.email,
      fullName: this.fullName,
      phoneNumber: this.phoneNumber,
      createdAt: this.createdAt.toISOString(),
    };
  }
}
