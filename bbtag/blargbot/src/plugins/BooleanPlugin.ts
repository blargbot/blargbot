import { BBTagPlugin } from '@bbtag/engine';

export abstract class BooleanPlugin {
    public abstract parseBoolean(value: string, options?: BooleanPluginOptions): boolean | undefined;
}

@BBTagPlugin.provides(BooleanPlugin)
export class DefaultBooleanPlugin extends BooleanPlugin {
    public override parseBoolean(value: string, options?: BooleanPluginOptions): boolean | undefined {
        if (options?.allowNumbers !== false) {
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
                return undefined;
        }
    }
}

interface BooleanPluginOptions {
    readonly allowNumbers?: boolean;
}
