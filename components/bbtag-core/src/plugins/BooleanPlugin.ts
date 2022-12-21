import { NotABooleanError } from '../errors/NotABooleanError.js';
import type { BBTagProcess } from '../runtime/BBTagProcess.js';
import { BBTagPlugin } from './BBTagPlugin.js';

export abstract class BooleanPlugin extends BBTagPlugin {
    public abstract parseBoolean(value: string, options?: BooleanPluginOptions<undefined>): boolean;
    public abstract parseBoolean<T>(value: string, options?: BooleanPluginOptions<T>): boolean | T;
}

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
