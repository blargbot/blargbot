import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { bbtag, SubtagType } from '../../utils/index.js';
import { cleanUrl, isUrl, readDataUrl } from '../../utils/url.js';
import { ReasonSubtag } from '../bot/reason.js';
import { RoleIdSubtag } from '../role/roleId.js';
import type { ApiResult, GetMemberPermissionsFeature, HttpFetchFeature, VariablesFeature } from '../types.js';

const tag = templates.subtags.emojiCreate;

export type CreateEmojiResult = ApiResult<{ emojiId: string; }, { cause: string; }>;

export interface CreateEmojiOptions {
    readonly guildId: string;
    readonly name: string;
    readonly image: Uint8Array;
    readonly contentType: string;
    readonly roles: readonly string[];
    readonly auditReason: string;
}

export interface CreateEmojiFeature {
    createEmoji(options: CreateEmojiOptions): Promise<CreateEmojiResult>;
}

type Features = VariablesFeature & HttpFetchFeature & CreateEmojiFeature & GetMemberPermissionsFeature;
export class EmojiCreateSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
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
        this.#features = features;
    }

    public async createEmoji(
        context: BBTagContext,
        name: string,
        imageStr: string,
        rolesStr: string
    ): Promise<string> {
        const permissions = await this.#features.getMemberPermissions(context.root.guildId, context.root.authorizerId);
        if (!permissions.hasAny('ADMINISTRATOR', 'CREATE_GUILD_EXPRESSIONS'))
            throw new BBTagRuntimeError('Author cannot create emojis');

        if (name === '')
            throw new BBTagRuntimeError('Name was not provided');

        let image;
        let contentType;
        const roles = [];
        imageStr = cleanUrl(imageStr);
        if (isUrl(imageStr)) {
            const res = await this.#features.fetch(imageStr);
            contentType = res.headers.get('content-type');
            image = await res.bytes();
        } else {
            const dataUri = readDataUrl(imageStr);
            if (dataUri === undefined)
                throw new BBTagRuntimeError('Image was not a buffer or a URL');
            ({ contentType, bytes: image } = dataUri);
        }

        const variables = this.#features.variables.forContext(context);
        //TODO would be nice to be able to provide one role without using an array like {emojicreate;name;image;role} and not {emojicreate;name;image;["role"]}
        const roleArray = await bbtag.tagArray.deserializeOrGetArray(variables, rolesStr);
        if (roleArray !== undefined) {
            for (const roleQuery of roleArray.v) {
                // eslint-disable-next-line @typescript-eslint/no-base-to-string
                const roleId = await RoleIdSubtag.query(context, roleQuery?.toString() ?? '', { noLookup: true });
                if (roleId !== undefined)
                    roles.push(roleId);
            }
        }

        const result = await this.#features.createEmoji({
            guildId: context.root.guildId,
            name,
            image,
            contentType: contentType ?? 'application/octet-stream',
            roles,
            auditReason: await ReasonSubtag.get(context)
        });
        if (result.success)
            return result.emojiId;

        throw new BBTagRuntimeError(`Failed to create emoji: ${result.cause}`, result.reason);
    }
}
