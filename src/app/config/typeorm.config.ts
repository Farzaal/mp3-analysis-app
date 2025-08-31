import { DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';

export const getTypeOrmConfig = async (
  config: ConfigService,
): Promise<DataSourceOptions> => {
  return {
    type: 'postgres',
    host: config.get('DB_HOST'),
    port: parseInt(config.get('DB_PORT'), 10),
    username: config.get('DB_USERNAME'),
    password: config.get('DB_PASSWORD'),
    database: config.get('DB_DATABASE'),
    entities: [__dirname + '/../**/*.model{.ts,.js}'],
    migrations: ['dist/app/migrations/*{.ts,.js}'],
    synchronize: false,
    logging: false,
  };
};
