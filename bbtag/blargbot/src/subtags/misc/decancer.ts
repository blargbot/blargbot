import { Subtag } from '@bbtag/subtag';

import { DecancerPlugin } from '../../plugins/DecancerPlugin.js';
import { p } from '../p.js';

export class DecancerSubtag extends Subtag {
    public constructor() {
        super({
            name: 'decancer'
        });
    }

    @Subtag.signature({ id: 'default', returns: 'string' })
        .parameter(p.plugin(DecancerPlugin))
        .parameter(p.string('text'))
    public decancer(decancer: DecancerPlugin, text: string): string {
        return decancer.decancer(text);
    }
}
