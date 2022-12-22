import { BBTagRuntimeError, NotANumberError } from '@bbtag/engine';
import { Subtag } from '@bbtag/subtag';
import { parse } from '@blargbot/core/utils/index.js';

import type { SubtagArgument } from '../../arguments/index.js';
import { p } from '../p.js';

export class ChooseSubtag extends Subtag {
    public constructor() {
        super({
            name: 'choose',
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['choice', '~options+'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: (_, [choice, ...options]) => this.choose(choice.value, options)
                }
            ]
        });
    }
    public choose(
        choice: string,
        options: SubtagArgument[]
    ): Promise<string> | string {
        const index = parse.int(choice);

        if (index === undefined)
            throw new NotANumberError(choice);

        if (index < 0)
            throw new BBTagRuntimeError('Choice cannot be negative');

        if (index >= options.length)
            throw new BBTagRuntimeError('Index out of range');

        return options[index].wait();
    }
}
