import { BaseRuntimeLimit } from './BaseRuntimeLimit';
import { DisabledRule } from './rules/DisabledRule';
import { StaffOnlyRule } from './rules/StaffOnlyRule';
import { UseCountRule } from './rules/UseCountRule';

export class GeneralAutoResponseLimit extends BaseRuntimeLimit {
    public readonly scopeName = 'general autoresponses';

    public constructor() {
        super('GeneralAutoResponseLimit');

        this.addRules('ban', StaffOnlyRule.instance)
            .addRules('unban', StaffOnlyRule.instance)
            .addRules('guildbans', StaffOnlyRule.instance)
            .addRules('kick', StaffOnlyRule.instance)
            .addRules('modlog', StaffOnlyRule.instance)
            .addRules('pardon', StaffOnlyRule.instance)
            .addRules('warn', StaffOnlyRule.instance)
            .addRules('reason', StaffOnlyRule.instance)
            .addRules('slowmode', StaffOnlyRule.instance)
            .addRules('roleadd', StaffOnlyRule.instance)
            .addRules('rolecreate', StaffOnlyRule.instance)
            .addRules('roledelete', StaffOnlyRule.instance)
            .addRules('rolemention', StaffOnlyRule.instance)
            .addRules('roleremove', StaffOnlyRule.instance)
            .addRules('rolesetmentionable', StaffOnlyRule.instance)
            .addRules('rolesetperms', StaffOnlyRule.instance)
            .addRules('rolesetposition', StaffOnlyRule.instance)
            .addRules('guildseticon', StaffOnlyRule.instance, new UseCountRule(1))
            .addRules('emojicreate', StaffOnlyRule.instance)
            .addRules('emojidelete', StaffOnlyRule.instance)
            .addRules('channelcreate', StaffOnlyRule.instance)
            .addRules('channeldelete', StaffOnlyRule.instance)
            .addRules('channeledit', StaffOnlyRule.instance)
            .addRules('channelsetperms', StaffOnlyRule.instance)
            .addRules('channelsetpos', StaffOnlyRule.instance)
            .addRules('dm', StaffOnlyRule.instance, new UseCountRule(1))
            .addRules('send', StaffOnlyRule.instance, new UseCountRule(1))
            .addRules('edit', StaffOnlyRule.instance, new UseCountRule(1))
            .addRules('delete', StaffOnlyRule.instance, new UseCountRule(2))
            .addRules('reactremove', new UseCountRule(1))
            .addRules('reactremove:requests', new UseCountRule(20, ['Request', 'requests']))
            .addRules('timer', DisabledRule.instance)
            .addRules('usersetnick', StaffOnlyRule.instance)
            .addRules('waitmessage', DisabledRule.instance)
            .addRules('waitreaction', DisabledRule.instance)
            .addRules([
                'for:loops',
                'repeat:loops',
                'while:loops'
            ], new UseCountRule(1000, ['Loop', 'loops']))
            .addRules('foreach:loops', new UseCountRule(2000, ['Loop', 'loops']))
            .addRules('map:loops', new UseCountRule(2000, ['Loop', 'loops']))
            .addRules('dump', new UseCountRule(5));
    }
}
