import type { BBTagProcess } from '@bbtag/engine';
import { BBTagPlugin } from '@bbtag/engine';

import { NotABooleanError } from '../errors/NotABooleanError.js';

export abstract class BooleanPlugin extends BBTagPlugin {
    public abstract parseBoolean(value: string, options?: BooleanPluginOptions<undefined>): boolean;
    public abstract parseBoolean<T>(value: string, options?: BooleanPluginOptions<T>): boolean | T;
}

@BBTagPlugin.factory(BooleanPlugin)
export class DefaultBooleanPlugin extends BooleanPlugin {
    public static type = BooleanPlugin;
    public static createPlugin(process: BBTagProcess): DefaultBooleanPlugin {
        return new DefaultBooleanPlugin(process);
    }

    public override parseBoolean<T>(value: string, options?: BooleanPluginOptions<T>): boolean | T {
        if (options?.numbers !== false) {
            const asNumber = parseFloat(value);
            if (!isNaN(asNumber))
                return Boolean(asNumber);
        }

        switch (value.toLowerCase()) {
            case 'true':
            case 't':
            case 'yes':
            case 'y':
                return true;
            case 'false':
            case 'f':
            case 'no':
            case 'n':
                return false;
            default:
                if (options?.default === undefined)
                    throw new NotABooleanError(value);
                return options.default;
        }
    }
}

interface BooleanPluginOptions<T> {
    readonly default?: T;
    readonly numbers?: boolean;
}
