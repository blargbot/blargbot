import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError } from '../../errors';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.pad;

export class PadSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'pad',
            category: SubtagType.MISC,
            deprecated: 'realpad',
            definition: [
                {
                    parameters: ['direction', 'back', 'text'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
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
