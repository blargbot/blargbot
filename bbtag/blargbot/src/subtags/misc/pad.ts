import { BBTagRuntimeError } from '@bbtag/engine';
import { Subtag } from '@bbtag/subtag';

import { p } from '../p.js';

export class PadSubtag extends Subtag {
    public constructor() {
        super({
            name: 'pad',
            deprecated: true
        });
    }

    @Subtag.signature({ id: 'default' })
        .parameter(p.string('direction'))
        .parameter(p.string('back'))
        .parameter(p.string('text'))
    public pad(direction: string, backing: string, overlay: string): string {
        if (overlay.length > backing.length)
            return overlay;
        switch (direction.toLowerCase()) {
            case 'left': return backing.slice(0, backing.length - overlay.length) + overlay;
            case 'right': return overlay + backing.slice(overlay.length);
            default: throw new BBTagRuntimeError('Invalid direction');
        }
    }
}
