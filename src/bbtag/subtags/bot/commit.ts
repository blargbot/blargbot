import { parse } from '@blargbot/core';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { templates } from '../../text.js';
import { bbtag, SubtagType } from '../../utils/index.js';
import type { VariablesProvider } from '../../Variables.js';

const tag = templates.subtags.commit;

export class CommitSubtag extends CompiledSubtag {
    readonly #variables: VariablesProvider;
    public constructor({ variables }: { variables: VariablesProvider; }) {
        super({
            name: 'commit',
            category: SubtagType.BOT,
            description: tag.description,
            definition: [
                {
                    parameters: [],
                    description: tag.all.description,
                    exampleCode: tag.all.exampleCode,
                    exampleOut: tag.all.exampleOut,
                    returns: 'nothing',
                    execute: (ctx) => this.commit(ctx, [])
                },
                {
                    parameters: ['variables+'],
                    description: tag.variables.description,
                    exampleCode: tag.variables.exampleCode,
                    exampleOut: tag.variables.exampleOut,
                    returns: 'nothing',
                    execute: (ctx, variables) => this.commit(ctx, variables.map((arg) => arg.value))
                }
            ]
        });
        this.#variables = variables;
    }

    public async commit(
        context: BBTagContext,
        args: string[]
    ): Promise<void> {
        const values = args.length === 0
            ? undefined
            : bbtag.tagArray.flattenArray(args).map(value => parse.string(value));
        await this.#variables.forContext(context).persist(values);
    }
}
