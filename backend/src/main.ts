import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('Accounts example')
    .setDescription('The tsbank API description')
    .setVersion('1.0')
    .addTag('accounts')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const typeOfEnv = process.env.TYPE_ENV;

  let port = 3000;

  switch (typeOfEnv) {
    case 'dev':
      port = 3000;
      console.log('Development mode');
      break;
    case 'prod':
      port = 8080;
      console.log('Production mode');
      break;
    default:
      console.log('No environment defined');
      break;
  }

  await app.listen(port);
}
bootstrap();
