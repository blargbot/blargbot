import { IServiceProvider } from '../serviceProviders';
import { IServiceScope } from './IServiceScope';

export class TransientServiceScope implements IServiceScope {
    public resolve<T>(factory: (provider: IServiceProvider) => T, provider: IServiceProvider): T {
        return factory(provider);
    }
}
