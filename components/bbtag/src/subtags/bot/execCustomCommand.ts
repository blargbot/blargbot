import { humanize } from '@blargbot/core/utils/index.js';
import type { GuildStore } from '@blargbot/domain/stores/GuildStore.js';

import type { BBTagContext } from '../../BBTagContext.js';
import type { BBTagValueConverter } from '../../BBTagUtilities.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import { parseBBTag } from '../../language/parseBBTag.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { BBTagRuntimeState } from '../../types.js';
import type { BBTagArrayTools } from '../../utils/index.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.execCustomCommand;

@Subtag.names('execCustomCommand', 'execCC')
@Subtag.ctorArgs(Subtag.arrayTools(), Subtag.converter(), Subtag.store('guilds'))
export class ExecCustomCommandSubtag extends CompiledSubtag {
    readonly #arrayTools: BBTagArrayTools;
    readonly #converter: BBTagValueConverter;
    readonly #guilds: GuildStore;

    public constructor(arrayTools: BBTagArrayTools, converter: BBTagValueConverter, guilds: GuildStore) {
        super({
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['name', 'args*'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: (ctx, [name, ...args]) => this.execCustomCommand(ctx, name.value, args.map(a => a.value))
                }
            ]
        });

        this.#arrayTools = arrayTools;
        this.#converter = converter;
        this.#guilds = guilds;
    }

    public async execCustomCommand(context: BBTagContext, name: string, args: string[]): Promise<string> {
        const tagName = name.toLowerCase();
        const ccommand = await context.getTag('cc', tagName, (key) => this.#guilds.getCommand(context.guild.id, key));

        if (ccommand === null)
            throw new BBTagRuntimeError(`CCommand not found: ${tagName}`);
        if ('alias' in ccommand)
            throw new BBTagRuntimeError(`Cannot execcc imported tag: ${tagName}`);

        let input = args[0] ?? '';
        if (args.length > 1)
            input = humanize.smartSplit.inverse(this.#arrayTools.flattenArray(args).map(x => this.#converter.string(x)));

        return await context.withScope(true, () => context.withChild({
            tagName,
            cooldown: ccommand.cooldown ?? 0,
            inputRaw: input
        }, async context => {
            const ast = parseBBTag(ccommand.content);
            const result = await context.withStack(() => context.eval(ast));
            if (context.data.state === BBTagRuntimeState.RETURN)
                context.data.state = BBTagRuntimeState.RUNNING;
            return result;
        }));
    }
}
