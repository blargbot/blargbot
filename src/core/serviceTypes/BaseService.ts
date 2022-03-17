import { Logger } from '@blargbot/logger';

export abstract class BaseService {
    public readonly name: string;
    public abstract readonly type: string;

    public constructor(name?: string) {
        this.name = name ?? this.constructor.name;
    }

    public abstract start(): Awaitable<void>;
    public abstract stop(): Awaitable<void>;

    protected makeSafeCaller<Args extends unknown[]>(body: (...args: Args) => Awaitable<unknown>, logger: Logger, serviceType: string): (...args: Args) => void {
        const callSafe = async (...args: Args): Promise<void> => {
            try {
                logger.debug(`Executing ${serviceType} ${this.name}`);
                await body(...args);
            } catch (err: unknown) {
                logger.error(`${serviceType} ${this.name} threw an error`, err);
            }
        };
        return (...args) => void callSafe(...args);
    }
}
