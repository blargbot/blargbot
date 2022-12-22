import type { BBTagProcess } from '@bbtag/engine';
import { BBTagPlugin } from '@bbtag/engine';

export abstract class QuietPlugin {
    public abstract isQuiet: boolean;
}

@BBTagPlugin.provides(QuietPlugin)
export class DefaultQuietPlugin extends QuietPlugin {

    @BBTagPlugin.persistLocal()
    public isQuiet = false;

    public constructor(process: BBTagProcess) {
        super();
        BBTagPlugin.setProcess(this, process);
        this.isQuiet = false;
    }
}
