import { BBTagPlugin } from '@bbtag/engine';

export abstract class StringPlugin {
    public abstract toString(value: unknown): string;
}

@BBTagPlugin.provides(StringPlugin)
export class DefaultStringPlugin extends StringPlugin {
    public override toString(value: unknown): string {
        switch (typeof value) {
            case 'string': return value;
            case 'object': return value === null ? '' : JSON.stringify(value);
            case 'symbol':
            case 'function':
            case 'undefined': return '';
            case 'bigint':
            case 'boolean':
            case 'number':
                return value.toString();
        }
    }
}
