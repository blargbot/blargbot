export abstract class BaseService {
    public readonly name: string;
    public readonly type: string;

    protected constructor(name?: string, type?: string) {
        this.name = name ?? this.constructor.name;
        this.type = type ?? 'Generic service';
    }

    public abstract start(): void | Promise<void>;
    public abstract stop(): void | Promise<void>;
}