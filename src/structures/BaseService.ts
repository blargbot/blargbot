export abstract class BaseService {
    public readonly name: string;
    public abstract get type(): string;

    protected constructor() {
        this.name = this.constructor.name;
    }

    public abstract start(): void;
    public abstract stop(): void;
}