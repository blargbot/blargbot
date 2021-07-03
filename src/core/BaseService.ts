export abstract class BaseService {
    public readonly name: string;
    public abstract readonly type: string;

    protected constructor(name?: string) {
        this.name = name ?? this.constructor.name;
    }

    public abstract start(): void | Promise<void>;
    public abstract stop(): void | Promise<void>;
}
