import { IServiceProvider } from '../serviceProviders';

export interface IServiceScope {
    resolve<T>(factory: (provider: IServiceProvider) => T, provider: IServiceProvider): T;
}
