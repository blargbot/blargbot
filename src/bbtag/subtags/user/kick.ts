import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError, UserNotFoundError } from '../../errors';
import { SubtagType } from '../../utils';

export class KickSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: `kick`,
            category: SubtagType.USER,
            description: `If the kick is successful, \`Success\` will be returned, otherwise the error will be given. `,
            definition: [
                {
                    parameters: [`user`],
                    description: `Kicks \`user\`.`,
                    exampleCode: `{kick;stupid cat} @stupid cat was kicked!`,
                    exampleOut: `Success @stupid cat was kicked!`,
                    returns: `string`,
                    execute: (ctx, [user]) => this.kickMember(ctx, user.value, ``, false)
                },
                {
                    parameters: [`user`, `reason`, `noPerms?`],
                    description: `Kicks \`user\`. If \`noPerms\` is provided and not an empty string, do not check if the command executor is actually able to kick people. Only provide this if you know what you're doing.`,
                    exampleCode: `{kick;stupid cat;because I can} @stupid cat was kicked!`,
                    exampleOut: `Success @stupid cat was kicked, because I can!`,
                    returns: `string`,
                    execute: (ctx, [user, reason, noPerms]) => this.kickMember(ctx, user.value, reason.value, noPerms.value !== ``)
                }
            ]
        });
    }

    public async kickMember(
        context: BBTagContext,
        userStr: string,
        reason: string,
        noPerms: boolean
    ): Promise<string> {
        const member = await context.queryMember(userStr, { noLookup: true /* TODO why? */ });
        if (member === undefined)
            throw new UserNotFoundError(userStr);

        if (reason === ``)
            reason = `Tag Kick`;

        const authorizer = noPerms ? context.authorizer?.user ?? context.user : context.user;
        const response = await context.util.kick(member, context.user, authorizer, reason);

        switch (response) {
            case `success`: //Successful
                return `Success`; //TODO true/false response
            case `noPerms`: //Bot doesnt have perms
                throw new BBTagRuntimeError(`Bot has no permissions`, `I don't have permission to kick users!`);
            case `memberTooHigh`: //Bot cannot kick target
                throw new BBTagRuntimeError(`Bot has no permissions`, `I don't have permission to kick ${member.user.username}!`);
            case `moderatorNoPerms`: //User doesnt have perms
                throw new BBTagRuntimeError(`User has no permissions`, `You don't have permission to kick users!`);
            case `moderatorTooLow`: //User cannot kick target
                throw new BBTagRuntimeError(`User has no permissions`, `You don't have permission to kick ${member.user.username}!`);
        }
    }
}
