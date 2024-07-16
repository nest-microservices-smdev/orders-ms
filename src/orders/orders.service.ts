import {
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { RpcException } from '@nestjs/microservices';

import { CreateOrderDto } from './dto/index';
import { PaginationResult } from 'src/common/interfaces';
import { Order } from './entities/order.entity';
import { OrderPaginationDto } from './dto/order-pagination.dto';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    try {
      await this.$connect();
    } catch (error) {
      throw new InternalServerErrorException(
        `Error connecting to the database: ${error.message}`,
      );
    }
  }

  create(createOrderDto: CreateOrderDto): Promise<Order> {
    return this.order.create({
      data: createOrderDto,
    });
  }

  async findAll(
    orderPaginationDto: OrderPaginationDto,
  ): Promise<PaginationResult<Order>> {
    const totalPages = await this.order.count({
      where: {
        status: orderPaginationDto.status,
      },
    });

    const currentPage = orderPaginationDto.page;
    const perPage = orderPaginationDto.limit;

    const orders = await this.order.findMany({
      skip: (currentPage - 1) * perPage,
      take: perPage,
      where: {
        status: orderPaginationDto.status,
      },
    });

    const meta = {
      total: totalPages,
      page: currentPage,
      lastPage: Math.ceil(totalPages / perPage),
    };

    return {
      data: orders,
      meta,
    };
  }

  async findOne(id: string) {
    const order = await this.order.findFirst({
      where: { id },
    });

    if (!order) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Order with id ${id} not found`,
      });
    }

    return order;
  }

  changeOrderStatus(id: number) {
    return `This action updates a #${id} order`;
  }
}
