import { guard, parse } from '@blargbot/core';
import { asBuffer } from '@blargbot/util';
import * as eris from 'eris';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { bbtag, SubtagType } from '../../utils/index.js';
import type { VariablesProvider } from '../../Variables.js';

const tag = templates.subtags.emojiCreate;

interface EmojiCreateOptions {
    name: string;
    image: string;
    roles: string[];
}

export class EmojiCreateSubtag extends CompiledSubtag {
    readonly #fetch: typeof globalThis.fetch;
    readonly #variables: VariablesProvider;
    public constructor({ fetch, variables }: { fetch: typeof globalThis.fetch; variables: VariablesProvider; }) {
        super({
            name: 'emojiCreate',
            category: SubtagType.GUILD,
            definition: [
                {
                    parameters: ['name', 'image', 'roles?'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'id',
                    execute: (ctx, [name, image, roles]) => this.createEmoji(ctx, name.value, image.value, roles.value)
                }
            ]
        });
        this.#fetch = fetch;
        this.#variables = variables;
    }

    public async createEmoji(
        context: BBTagContext,
        name: string,
        imageStr: string,
        rolesStr: string
    ): Promise<string> {
        if (!context.hasPermission('CREATE_GUILD_EXPRESSIONS'))
            throw new BBTagRuntimeError('Author cannot create emojis');

        const options: EmojiCreateOptions = {
            name,
            image: imageStr,
            roles: []
        };

        if (options.name === '')
            throw new BBTagRuntimeError('Name was not provided');

        const image: string = parse.url(options.image);
        if (guard.isUrl(image)) {
            const res = await this.#fetch(image);
            const contentType = res.headers.get('content-type');
            options.image = `data:${contentType ?? ''};base64,${asBuffer(await res.bytes()).toString('base64')}`;
        } else if (!image.startsWith('data:')) {
            throw new BBTagRuntimeError('Image was not a buffer or a URL');
        }

        const variables = this.#variables.forContext(context);
        //TODO would be nice to be able to provide one role without using an array like {emojicreate;name;image;role} and not {emojicreate;name;image;["role"]}
        const roleArray = await bbtag.tagArray.deserializeOrGetArray(variables, rolesStr);
        if (roleArray !== undefined) {
            for (const roleQuery of roleArray.v) {
                // eslint-disable-next-line @typescript-eslint/no-base-to-string
                const role = await context.queryRole(roleQuery?.toString() ?? '', { noLookup: true });
                if (role !== undefined) {
                    options.roles.push(role.id);
                }
            }
        }

        try {
            const emoji = await context.root.message.channel.guild.createEmoji({ image: options.image, name: options.name, roles: options.roles }, context.auditReason());
            return emoji.id;
        } catch (err: unknown) {
            if (!(err instanceof eris.DiscordRESTError))
                throw err;

            const parts = err.message.split('\n').map(m => m.trim());
            throw new BBTagRuntimeError(`Failed to create emoji: ${parts[1] ?? parts[0]}`);
        }
    }
}
