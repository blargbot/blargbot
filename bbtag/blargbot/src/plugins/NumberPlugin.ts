import { BBTagPlugin } from '@bbtag/engine';

import { NotANumberError } from '../errors/NotANumberError.js';

export abstract class NumberPlugin {
    public abstract parseFloat(value: string): number;
    public abstract parseInt(value: string, radix?: number): number;
}

@BBTagPlugin.provides(NumberPlugin)
export class DefaultNumberPlugin extends NumberPlugin {
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
