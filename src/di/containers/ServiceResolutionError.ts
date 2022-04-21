import { Type } from '../types';

export class ServiceResolutionError<T> extends Error {
    public constructor(
        public readonly type: Type<T>,
        public readonly innerError: unknown
    ) {
        super(`Error while resolving service for type ${type.name}`);

        this.stack;
    }
}
