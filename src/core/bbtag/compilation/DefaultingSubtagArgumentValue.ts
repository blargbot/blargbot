import { Statement, SubtagArgumentValue as ISubtagArgumentValue } from '../types';


export class DefaultingSubtagArgumentValue implements ISubtagArgumentValue {
    public get isCached(): boolean { return this.innerArg.isCached; }
    public get raw(): string { return this.innerArg.raw; }
    public get value(): string { return this.handleResult(this.innerArg.value); }
    public get code(): Statement { return this.innerArg.code; }

    public constructor(
        private readonly innerArg: ISubtagArgumentValue,
        private readonly defaultValue: string) {
    }

    public async wait(): Promise<string> {
        return this.handleResult(await this.innerArg.wait());
    }

    public async execute(): Promise<string> {
        return this.handleResult(await this.innerArg.execute());
    }

    private handleResult(result: string): string {
        return result.length === 0
            ? this.defaultValue
            : result;
    }
}
