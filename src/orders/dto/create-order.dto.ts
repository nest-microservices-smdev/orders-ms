import { OrderStatus } from '@prisma/client';
import { OrderStatusList } from '../enum/order.enum';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
} from 'class-validator';

export class CreateOrderDto {
  @IsNumber()
  @IsPositive()
  totalAmount: number;

  @IsNumber()
  @IsPositive()
  totalItems: number;

  @IsEnum(OrderStatusList, {
    message: `Status must be one of the following values: ${OrderStatusList}`,
  })
  status = OrderStatus.PENDING;

  @IsBoolean()
  @IsOptional()
  paid = false;
}
