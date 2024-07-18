import {
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ClientProxy, RpcException } from '@nestjs/microservices';

import {
  CreateOrderDto,
  OrderPaginationDto,
  ChangeOrderStatusDto,
} from './dto/index';
import { PaginationResult } from 'src/common/interfaces';
import { Order } from './entities/order.entity';
import { PRODUCT_SERVICE } from 'src/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {
  constructor(
    @Inject(PRODUCT_SERVICE) private readonly productsClient: ClientProxy,
  ) {
    super();
  }

  async onModuleInit() {
    try {
      await this.$connect();
    } catch (error) {
      throw new InternalServerErrorException(
        `Error connecting to the database: ${error.message}`,
      );
    }
  }

  async create(createOrderDto: CreateOrderDto) {
    const productIds = createOrderDto.items.map(({ productId }) => productId);

    let products: any[];

    try {
      products = await firstValueFrom(
        this.productsClient.send(
          { cmd: 'product_validate_products' },
          { ids: productIds },
        ),
      );
    } catch (error) {
      throw new RpcException(error);
    }

    const orderItemsFormatted = [];
    let totalAmount = 0;
    let totalItems = 0;

    createOrderDto.items.forEach(({ productId, quantity }) => {
      const product = products.find(({ id }) => id === productId);

      const orderItemFormatted = {
        price: product.price,
        productId,
        quantity,
      };

      orderItemsFormatted.push(orderItemFormatted);
      totalAmount += product.price * quantity;
      totalItems += quantity;
    });

    const orderCreated = await this.order.create({
      data: {
        totalAmount,
        totalItems,
        OrderItem: {
          createMany: {
            data: orderItemsFormatted,
          },
        },
      },
    });

    return orderCreated;
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

  async changeOrderStatus(changeOrderStatusDto: ChangeOrderStatusDto) {
    const { id, status } = changeOrderStatusDto;

    const currentOrder = await this.findOne(id);

    if (currentOrder.status === status) return currentOrder;

    return this.order.update({
      where: { id },
      data: { status },
    });
  }
}
