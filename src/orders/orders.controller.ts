import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
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
  findOne(@Payload() id: number) {
    return this.ordersService.findOne(id);
  }

  @MessagePattern({ cmd: Actions.Update })
  update(@Payload() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(updateOrderDto.id, updateOrderDto);
  }

  @MessagePattern({ cmd: Actions.Delete })
  remove(@Payload() id: number) {
    return this.ordersService.remove(id);
  }
}
