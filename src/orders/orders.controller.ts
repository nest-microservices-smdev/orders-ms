import { Controller, ParseIntPipe, ParseUUIDPipe } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/index';
import { getActionName } from 'src/common/constants';

const ACTIONS = getActionName('order');

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @MessagePattern({ cmd: ACTIONS.create })
  create(@Payload() createOrderDto: CreateOrderDto) {
    console.log('createOrderDto', createOrderDto);
    return this.ordersService.create(createOrderDto);
  }

  @MessagePattern({ cmd: ACTIONS.findAll })
  findAll() {
    return this.ordersService.findAll();
  }

  @MessagePattern({ cmd: ACTIONS.findOne })
  findOne(@Payload('id', ParseUUIDPipe) id: string) {
    return this.ordersService.findOne(id);
  }

  @MessagePattern({ cmd: ACTIONS.changeOrderStatus })
  ChangeOrderStatus(@Payload('id', ParseIntPipe) id: number) {
    return this.ordersService.changeOrderStatus(id);
  }
}
