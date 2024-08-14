export class Order {
  id: string;
  totalAmount: number;
  totalItems: number;
  status: string;
  paid: boolean;
  paidAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
