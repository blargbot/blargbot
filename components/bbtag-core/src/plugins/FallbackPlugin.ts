import type { BBTagProcess } from '../index.js';
import { BBTagPlugin } from './BBTagPlugin.js';

export abstract class FallbackPlugin extends BBTagPlugin {
    public abstract fallback?: string;
}

export class DefaultFallbackPlugin extends FallbackPlugin {
    public static type = FallbackPlugin;
    public static createPlugin(process: BBTagProcess): DefaultFallbackPlugin {
        return new DefaultFallbackPlugin(process);
    }

    @BBTagPlugin.persistLocal()
    public fallback?: string;

    public constructor(process: BBTagProcess) {
        super(process);
    }
}
