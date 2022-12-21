import type { BBTagProcess } from '../runtime/BBTagProcess.js';
import { BBTagPlugin } from './BBTagPlugin.js';

export abstract class QuietPlugin extends BBTagPlugin {
    public abstract isQuiet: boolean;
}

export class DefaultQuietPlugin extends QuietPlugin {
    public static type = QuietPlugin;
    public static createPlugin(process: BBTagProcess): DefaultQuietPlugin {
        return new DefaultQuietPlugin(process);
    }

    @BBTagPlugin.persistLocal()
    public isQuiet: boolean;

    public constructor(process: BBTagProcess) {
        super(process);
        this.isQuiet = false;
    }
}
