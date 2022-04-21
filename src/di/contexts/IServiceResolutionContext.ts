import { ServiceLifetime } from '../containers';
import { IServiceScope } from '../scopes';
import { IServiceProvider } from '../serviceProviders';

export interface IServiceResolutionContext extends Record<ServiceLifetime, IServiceScope> {
    readonly provider: IServiceProvider;
}
