import { BBTagPlugin } from '@bbtag/engine';

export abstract class NumberPlugin {
    public abstract parseFloat(value: string): number | undefined;
    public abstract parseInt(value: string, radix?: number): number | undefined;
    public abstract parseBigint(value: string): bigint | undefined;
}

@BBTagPlugin.provides(NumberPlugin)
export class DefaultNumberPlugin extends NumberPlugin {
    public override parseFloat(value: string): number | undefined {
        value = value.replace(/[,.](?=.*[,.])/g, '').replace(',', '.');
        const result = parseFloat(value);
        if (isNaN(result))
            return undefined;

        return result;
    }

    public override parseInt(value: string, radix = 10): number | undefined {
        if (value.toLowerCase().startsWith('0x')) {
            radix = 16;
            value = value.slice(2);
        }

        value = value.replace(/[,.](?=.*[,.])/g, '').replace(',', '.');
        const result = parseInt(value, radix);
        if (isNaN(result))
            return undefined;

        return result;
    }

    public override parseBigint(value: string): bigint | undefined {
        try {
            return BigInt(value);
        } catch {
            return undefined;
        }
    }
}
