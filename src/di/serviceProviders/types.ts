import { IServiceResolutionContext } from '../contexts';

export type ServiceResolvers = Map<symbol, ServiceResolver[]>

export type ServiceResolver<T = unknown> = (context: IServiceResolutionContext) => T;
