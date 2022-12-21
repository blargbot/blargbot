import { NotANumberError } from '../errors/NotANumberError.js';
import type { BBTagProcess } from '../runtime/BBTagProcess.js';
import { BBTagPlugin } from './BBTagPlugin.js';

export abstract class NumberPlugin extends BBTagPlugin {
    public abstract parseFloat(value: string): number;
    public abstract parseInt(value: string, radix?: number): number;
}

export class DefaultNumberPlugin extends NumberPlugin {
    public static type = NumberPlugin;
    public static createPlugin(process: BBTagProcess): DefaultNumberPlugin {
        return new DefaultNumberPlugin(process);
    }

    public override parseFloat(value: string): number {
        const initial = value;
        value = value.replace(/[,.](?=.*[,.])/g, '').replace(',', '.');
        const result = parseFloat(value);
        if (isNaN(result))
            throw new NotANumberError(initial);

        return result;
    }

    public override parseInt(value: string, radix = 10): number {
        const initial = value;
        if (value.toLowerCase().startsWith('0x')) {
            radix = 16;
            value = value.slice(2);
        }

        value = value.replace(/[,.](?=.*[,.])/g, '').replace(',', '.');
        const result = parseInt(value, radix);
        if (isNaN(result))
            throw new NotANumberError(initial);

        return result;
    }
}
