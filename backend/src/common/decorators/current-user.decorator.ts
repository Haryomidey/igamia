import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    if (context.getType<'http' | 'ws'>() === 'ws') {
      return context.switchToWs().getClient().data?.user;
    }

    return context.switchToHttp().getRequest().user;
  },
);
