import { BaseSubtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class EscapeBbtagSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'escapebbtag',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    parameters: ['~input*'],
                    description: 'Returns `input` without resolving any BBTag' +
                        'This effectively returns the characters `{`, `}` and `;` as is, without the use of `{rb}`, `{lb}` and `{semi}`.' +
                        '\n**NOTE:** Brackets inside code must come in pairs. A `{` has to be followed by a `}` somewhere and a `} has to have a {` before it',
                    exampleCode: '{escapebbtag;{set;~index;1}}',
                    exampleOut: '{set;~index;1}',
                    execute: (_, args) => {
                        return args.map(arg => arg.raw).join(';');
                    }
                }
            ]
        });
    }
}
