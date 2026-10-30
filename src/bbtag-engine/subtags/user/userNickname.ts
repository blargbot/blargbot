import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { UserNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import { UserIdSubtag } from './userId.js';
import type { GetUserNameFeature } from './userName.js';

const tag = templates.subtags.userNickname;

export interface GetMemberNicknameFeature {
    getMemberNickname(guildId: string, userId: string): Promise<string | null | undefined>;
}
export interface GetUserNicknameFeature {
    getUserNickname(userId: string): Promise<string | null | undefined>;
}

type Features = GetMemberNicknameFeature & GetUserNicknameFeature & GetUserNameFeature;
export class UserNicknameSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'userNickname',
            aliases: ['userNick'],
            category: SubtagType.USER,
            definition: [
                {
                    parameters: [],
                    description: tag.target.description,
                    exampleCode: tag.target.exampleCode,
                    exampleOut: tag.target.exampleOut,
                    returns: 'string',
                    execute: (ctx) => this.getUserNick(ctx, '', true)
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: tag.user.description,
                    exampleCode: tag.user.exampleCode,
                    exampleOut: tag.user.exampleOut,
                    returns: 'string',
                    execute: (ctx, [userId, quiet]) => this.getUserNick(ctx, userId.value, quiet.value !== '')
                }
            ]
        });
        this.#features = features;
    }

    public async getUserNick(
        context: BBTagContext,
        userStr: string,
        quiet: boolean
    ): Promise<string> {
        quiet ||= context.local.quiet ?? false;
        const userId = await UserIdSubtag.query(context, userStr, { noLookup: quiet })
            ?? new UserNotFoundError(userStr).withDisplay(quiet ? '' : undefined).throw();

        return await this.#features.getMemberNickname(context.root.guildId, userId)
            ?? await this.#features.getUserNickname(userId)
            ?? await this.#features.getUserName(userId)
            ?? new UserNotFoundError(userStr).withDisplay(quiet ? '' : undefined).throw();
    }
}
