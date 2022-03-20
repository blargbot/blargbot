import { BBTagContext } from '../../BBTagContext';
import { DefinedSubtag } from '../../DefinedSubtag';
import { SubtagType } from '../../utils';

export class IsCCSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'iscc',
            category: SubtagType.SIMPLE,
            desc: 'Checks if the tag is being run from within a cc. Returns a boolean (`true` or `false`)',
            definition: [
                {
                    parameters: [],
                    exampleCode: '{if;{iscc};{dm;{userid};You have mail!};Boo, this only works in cc\'s}',
                    exampleOut: 'Boo, this only works in cc\'s',
                    returns: 'boolean',
                    execute: (ctx) => this.isCC(ctx)
                }
            ]
        });
    }

    public isCC(context: BBTagContext): boolean {
        return context.isCC;
    }
}
