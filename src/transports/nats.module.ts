import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envs, PRODUCT_SERVICE } from 'src/config';

const natsConfig = ClientsModule.register([
  {
    name: PRODUCT_SERVICE,
    transport: Transport.NATS,
    options: {
      servers: envs.natsServers,
    },
  },
]);

@Module({
  imports: [natsConfig],
  exports: [natsConfig],
})
export class NatsModule {}
