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
  OrderItemDto,
  OrderItemWithNameDto,
} from './dto/index';
import { PaginationResult } from 'src/common/interfaces';
import { Order } from './entities/order.entity';
import { NATS_SERVICE } from 'src/config';
import { firstValueFrom } from 'rxjs';
import { Product } from 'src/common/interfaces/product-schema.interface';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {
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

    let products: Product[];

    try {
      products = await firstValueFrom(
        this.client.send(
          { cmd: 'product_validate_products' },
          { ids: productIds },
        ),
      );
    } catch (error) {
      throw new RpcException(error);
    }

    const orderItemsFormatted: OrderItemDto[] = [];
    const orderItemsFormattedWithNames: OrderItemWithNameDto[] = [];
    let totalAmount: number = 0;
    let totalItems: number = 0;

    createOrderDto.items.forEach(({ productId, quantity }) => {
      const product: Product = products.find(({ id }) => id === productId);

      const orderItemFormatted: OrderItemDto = {
        price: product.price,
        productId,
        quantity,
      };

      const orderItemWithNameProduct: OrderItemWithNameDto = {
        ...orderItemFormatted,
        name: product.name,
      };

      orderItemsFormatted.push(orderItemFormatted);
      orderItemsFormattedWithNames.push(orderItemWithNameProduct);

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
      include: {
        OrderItem: {
          select: {
            productId: true,
            quantity: true,
            price: true,
          },
        },
      },
    });

    return {
      ...orderCreated,
      OrderItem: orderItemsFormattedWithNames,
    };
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
      include: {
        OrderItem: {
          select: {
            productId: true,
            quantity: true,
            price: true,
          },
        },
      },
    });

    if (!order) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Order with id ${id} not found`,
      });
    }

    let products: Product[];

    try {
      products = await firstValueFrom(
        this.client.send(
          { cmd: 'product_validate_products' },
          { ids: order.OrderItem.map(({ productId }) => productId) },
        ),
      );
    } catch (error) {
      throw new RpcException(error);
    }

    return {
      ...order,
      OrderItem: order.OrderItem.map((orderItem) => ({
        ...orderItem,
        name: products.find(({ id }) => id === orderItem.productId).name,
      })),
    };
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
