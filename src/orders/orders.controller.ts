import { Controller, ParseIntPipe } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Actions } from 'src/common/constants';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @MessagePattern({ cmd: Actions.Create })
  create(@Payload() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @MessagePattern({ cmd: Actions.Create })
  findAll() {
    return this.ordersService.findAll();
  }

  @MessagePattern({ cmd: Actions.FindOne })
  findOne(@Payload('id', ParseIntPipe) id: number) {
    return this.ordersService.findOne(id);
  }

  @MessagePattern({ cmd: Actions.ChangeOrderStatus })
  ChangeOrderStatus(@Payload('id', ParseIntPipe) id: number) {
    return this.ordersService.changeOrderStatus(id);
  }
}
