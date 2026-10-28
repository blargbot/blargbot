import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import { cleanUrl, isUrl, readDataUrl } from '../../utils/url.js';
import { ReasonSubtag } from '../bot/reason.js';
import type { ApiResult, GetMemberPermissionsFeature, HttpFetchFeature } from '../types.js';

const tag = templates.subtags.guildSetIcon;

export type SetGuildIconResult = ApiResult<null, { cause: string; }>

export interface SetGuildIconOptions {
    readonly guildId: string;
    readonly image: Uint8Array;
    readonly contentType: string;
    readonly auditReason: string;
}

export interface SetGuildIconFeature {
    setGuildIcon(options: SetGuildIconOptions): Promise<SetGuildIconResult>;
}

type Features = SetGuildIconFeature & HttpFetchFeature & GetMemberPermissionsFeature;
export class GuildSetIconSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'guildSetIcon',
            category: SubtagType.GUILD,
            definition: [
                {
                    parameters: ['image'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut, //TODO meaningful output
                    returns: 'nothing',
                    execute: (ctx, [image]) => this.setGuildIcon(ctx, image.value)

                }
            ]
        });
        this.#features = features;
    }

    public async setGuildIcon(context: BBTagContext, imageStr: string): Promise<void> {
        const permissions = await this.#features.getMemberPermissions(context.root.guildId, context.root.authorizerId);
        if (!permissions.hasAny('ADMINISTRATOR', 'MANAGE_GUILD'))
            throw new BBTagRuntimeError('Author cannot modify the guild');

        let image;
        let contentType;
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

        const result = await this.#features.setGuildIcon({
            guildId: context.root.guildId,
            image,
            contentType: contentType ?? 'application/octet-stream',
            auditReason: await ReasonSubtag.get(context)
        });

        if (result.success)
            return;

        throw new BBTagRuntimeError(`Failed to set icon: ${result.cause}`, result.reason);
    }
}
