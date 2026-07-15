import { Query, Resolver } from '@nestjs/graphql';
import { MethodsService } from './methods.service';
import { MethodType } from './dto/method.type';

@Resolver(() => MethodType)
export class MethodsResolver {
  constructor(private readonly methodsService: MethodsService) {}

  @Query(() => [MethodType], { name: 'methods' })
  findAll(): Promise<MethodType[]> {
    return this.methodsService.findAll();
  }
}
