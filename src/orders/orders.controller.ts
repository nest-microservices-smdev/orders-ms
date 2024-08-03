import { Controller, ParseUUIDPipe } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';

import { OrdersService } from './orders.service';
import {
  CreateOrderDto,
  OrderPaginationDto,
  ChangeOrderStatusDto,
} from './dto/index';
import { getActionName } from 'src/common/constants';

const ACTIONS = getActionName('order');

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @MessagePattern({ cmd: ACTIONS.create })
  async create(@Payload() createOrderDto: CreateOrderDto) {
    const order = await this.ordersService.create(createOrderDto);

    const paymentSession = await this.ordersService.createPaymentSession(order);

    return {
      order,
      paymentSession,
    };
  }

  @MessagePattern({ cmd: ACTIONS.findAll })
  findAll(paginationDto: OrderPaginationDto) {
    return this.ordersService.findAll(paginationDto);
  }

  @MessagePattern({ cmd: ACTIONS.findOne })
  findOne(@Payload('id', ParseUUIDPipe) id: string) {
    return this.ordersService.findOne(id);
  }

  @MessagePattern({ cmd: ACTIONS.changeOrderStatus })
  update(@Payload() changeOrderStatusDto: ChangeOrderStatusDto) {
    return this.ordersService.changeOrderStatus(changeOrderStatusDto);
  }

  @EventPattern({ cmd: 'payment.succeeded' })
  paidOrder(@Payload() paymentOrderDto: any) {
    console.log('Order paid', paymentOrderDto);
  }
}
