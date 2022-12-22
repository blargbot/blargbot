import type { BBTagProcess } from '@bbtag/engine';
import { BBTagPlugin } from '@bbtag/engine';

export abstract class StringPlugin extends BBTagPlugin {
    public abstract toString(value: unknown): string;
}

@BBTagPlugin.factory(StringPlugin)
export class DefaultStringPlugin extends StringPlugin {
    public static type = StringPlugin;
    public static createPlugin(process: BBTagProcess): DefaultStringPlugin {
        return new DefaultStringPlugin(process);
    }

    public constructor(process: BBTagProcess) {
        super(process);
    }

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
