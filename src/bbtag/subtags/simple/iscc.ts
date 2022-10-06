import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { SubtagType } from '../../utils';

export class IsCCSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: `iscc`,
            category: SubtagType.SIMPLE,
            definition: [
                {
                    parameters: [],
                    description: `Checks if the tag is being run from within a cc. Returns a boolean (\`true\` or \`false\`)`,
                    exampleCode: `{if;{iscc};{dm;{userid};You have mail!};Boo, this only works in cc's}`,
                    exampleOut: `Boo, this only works in cc's`,
                    returns: `boolean`,
                    execute: (ctx) => this.isCC(ctx)
                }
            ]
        });
    }

    public isCC(context: BBTagContext): boolean {
        return context.isCC;
    }
}
