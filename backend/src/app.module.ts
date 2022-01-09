import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MatchGateway } from './match.gateway';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { MatchModule } from './match/match.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
    MatchModule,
  ],
  controllers: [AppController],
  providers: [AppService, MatchGateway],
})
export class AppModule {}
