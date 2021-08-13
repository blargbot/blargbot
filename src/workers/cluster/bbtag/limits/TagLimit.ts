import { BaseRuntimeLimit } from './BaseRuntimeLimit';
import { DisabledRule, UseCountRule } from './rules';

export class TagLimit extends BaseRuntimeLimit {
    public readonly scopeName = 'tags';

    public constructor() {
        super('tagLimit');

        this.addRules('safeloops', new UseCountRule(100000))
            .addRules('ban', DisabledRule.instance)
            .addRules('unban', DisabledRule.instance)
            .addRules('guildbans', DisabledRule.instance)
            .addRules('kick', DisabledRule.instance)
            .addRules('modlog', DisabledRule.instance)
            .addRules('pardon', DisabledRule.instance)
            .addRules('warn', DisabledRule.instance)
            .addRules('reason', DisabledRule.instance)
            .addRules('slowmode', DisabledRule.instance)
            .addRules('roleadd', DisabledRule.instance)
            .addRules('rolecreate', DisabledRule.instance)
            .addRules('roledelete', DisabledRule.instance)
            .addRules('roleremove', DisabledRule.instance)
            .addRules('rolesetmentionable', DisabledRule.instance)
            .addRules('rolesetperms', DisabledRule.instance)
            .addRules('rolesetposition', DisabledRule.instance)
            .addRules('guildseticon', DisabledRule.instance)
            .addRules('emojicreate', DisabledRule.instance)
            .addRules('emojidelete', DisabledRule.instance)
            .addRules('channelcreate', DisabledRule.instance)
            .addRules('channeldelete', DisabledRule.instance)
            .addRules('channeledit', DisabledRule.instance)
            .addRules('channelsetperms', DisabledRule.instance)
            .addRules('channelsetpos', DisabledRule.instance)
            .addRules('dm', DisabledRule.instance)
            .addRules('send', DisabledRule.instance)
            .addRules('timer', DisabledRule.instance)
            .addRules('usersetnick', DisabledRule.instance)
            .addRules('edit', new UseCountRule(10))
            .addRules('delete', new UseCountRule(11))
            .addRules('reactremove', new UseCountRule(10))
            .addRules('reactremove:requests', new UseCountRule(40, ['Request', 'requests']))
            .addRules('waitmessage', new UseCountRule(5))
            .addRules('waitreaction', new UseCountRule(20))
            .addRules([
                'for:loops',
                'repeat:loops',
                'while:loops'
            ], new UseCountRule(1500, ['Loop', 'loops']))
            .addRules('foreach:loops', new UseCountRule(3000, ['Loop', 'loops']))
            .addRules('map:loops', new UseCountRule(3000, ['Loop', 'loops']))
            .addRules('dump', new UseCountRule(5));
    }

}
