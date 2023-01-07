import type { BBTagProcess } from '@bbtag/engine';
import { BBTagPlugin } from '@bbtag/engine';

export abstract class QuietPlugin {
    public abstract isQuiet: boolean;
    public abstract isSuppressed: boolean;
}

@BBTagPlugin.provides(QuietPlugin)
export class DefaultQuietPlugin extends QuietPlugin {

    @BBTagPlugin.persistLocal()
    public isQuiet = false;

    @BBTagPlugin.persistLocal()
    public isSuppressed = false;

    public constructor(process: BBTagProcess) {
        super();
        BBTagPlugin.setProcess(this, process);
        this.isQuiet = false;
    }
}
