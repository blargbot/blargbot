import { Subtag } from '@cluster/bbtag';
import { BBTagRuntimeError } from '@cluster/bbtag/errors';
import { SubtagType } from '@cluster/utils';

export class PadSubtag extends Subtag {
    public constructor() {
        super({
            name: 'pad',
            category: SubtagType.MISC,
            deprecated: 'realpad',
            definition: [
                {
                    parameters: ['direction', 'back', 'text'],
                    description: 'Places `text` ontop of `back` with it being aligned to the opposite of `direction`. If `text` is longer than `back` then it will simply overlap',
                    exampleCode: '{pad;left;000000;ABC}',
                    exampleOut: '000ABC',
                    returns: 'string',
                    execute: (_, [direction, back, text]) => this.pad(direction.value, back.value, text.value)
                }
            ]
        });
    }

    public pad(direction: string, backing: string, overlay: string): string {
        switch (direction.toLowerCase()) {
            case 'left': {
                if (overlay.length > backing.length)
                    return overlay;
                return backing.slice(0, backing.length - overlay.length) + overlay;
            }
            case 'right': {
                if (overlay.length > backing.length)
                    return overlay;
                return overlay + backing.slice(overlay.length);
            }
        }
        throw new BBTagRuntimeError('Invalid direction');
    }
}
