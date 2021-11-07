import { GlobalLimit } from './GlobalLimit';
import { disabledRule, StaffOnlyRule, UseCountRule } from './rules';

export class EverythingAutoResponseLimit extends GlobalLimit {
    public readonly scopeName = 'everything autoresponses';

    public constructor() {
        super('everythingAutoResponseLimit');

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
            .addRules('threadcreate', StaffOnlyRule.instance)
            .addRules('deletethread', StaffOnlyRule.instance)
            .addRules('dm', StaffOnlyRule.instance, new UseCountRule(1))
            .addRules('send', StaffOnlyRule.instance, new UseCountRule(1))
            .addRules('edit', new UseCountRule(1))
            .addRules('delete', new UseCountRule(2))
            .addRules('reactremove', new UseCountRule(1))
            .addRules('reactremove:requests', new UseCountRule(20, ['Request', 'requests']))
            .addRules('timer', disabledRule)
            .addRules('usersetnick', StaffOnlyRule.instance)
            .addRules('waitmessage', disabledRule)
            .addRules('waitreaction', disabledRule)
            .addRules([
                'for:loops',
                'repeat:loops',
                'while:loops'
            ], new UseCountRule(1000, ['Loop', 'loops']))
            .addRules('foreach:loops', new UseCountRule(10000, ['Loop', 'loops']))
            .addRules('map:loops', new UseCountRule(10000, ['Loop', 'loops']))
            .addRules('filter:loops', new UseCountRule(10000, ['Loop', 'loops']))
            .addRules('dump', new UseCountRule(5));
    }
}
