import Eris from 'eris';

import { BBTagRuntimeError, TooManyLoopsError } from '../errors';
import templates from '../text';
import { GlobalLimit } from './GlobalLimit';
import { staffOnlyRule, UseCountRule } from './rules';

export class CustomCommandLimit extends GlobalLimit {
    public constructor(guild?: Eris.Guild) {
        super('customCommandLimit');

        this.addRules('ban', staffOnlyRule)
            .addRules('unban', staffOnlyRule)
            .addRules('guildbans', staffOnlyRule)
            .addRules('kick', staffOnlyRule)
            .addRules('timeout', staffOnlyRule)
            .addRules('modlog', staffOnlyRule)
            .addRules('pardon', staffOnlyRule)
            .addRules('warn', staffOnlyRule)
            .addRules('reason', staffOnlyRule)
            .addRules('slowmode', staffOnlyRule)
            .addRules('roleadd', staffOnlyRule)
            .addRules('rolecreate', staffOnlyRule)
            .addRules('roledelete', staffOnlyRule)
            .addRules('rolemention', staffOnlyRule)
            .addRules('roleremove', staffOnlyRule)
            .addRules('rolesetmentionable', staffOnlyRule)
            .addRules('rolesetperms', staffOnlyRule)
            .addRules('rolesetposition', staffOnlyRule)
            .addRules('guildseticon', staffOnlyRule)
            .addRules('emojicreate', staffOnlyRule)
            .addRules('emojidelete', staffOnlyRule)
            .addRules('channelcreate', staffOnlyRule)
            .addRules('channeldelete', staffOnlyRule)
            .addRules('channeledit', staffOnlyRule)
            .addRules('channelsetperms', staffOnlyRule)
            .addRules('channelsetpos', staffOnlyRule)
            .addRules('threadcreate', staffOnlyRule)
            .addRules('deletethread', staffOnlyRule)
            .addRules('usersetnick', staffOnlyRule)
            .addRules('timer', staffOnlyRule)
            .addRules('dm', staffOnlyRule, new UseCountRule(1))
            .addRules('send', staffOnlyRule, new UseCountRule(10))
            .addRules('edit', new UseCountRule(10))
            .addRules('delete', new UseCountRule(21))
            .addRules('reactremove', new UseCountRule(10))
            .addRules('reactremove:requests', new UseCountRule(40, templates.limits.rules.useCount.requests, 'Request'))
            .addRules('timer', new UseCountRule(3))
            .addRules('waitmessage', new UseCountRule(10))
            .addRules('waitreaction', new UseCountRule(20))
            .addRules([
                'for:loops',
                'repeat:loops',
                'while:loops'
            ], new UseCountRule(10000, templates.limits.rules.useCount.loops, () => new TooManyLoopsError(10000)))
            .addRules('foreach:loops', new UseCountRule((guild?.memberCount ?? 0) + 100000, templates.limits.rules.useCount.loops, () => new TooManyLoopsError(1000000)))
            .addRules('map:loops', new UseCountRule((guild?.memberCount ?? 0) + 100000, templates.limits.rules.useCount.loops, () => new TooManyLoopsError(1000000)))
            .addRules('filter:loops', new UseCountRule((guild?.memberCount ?? 0) + 100000, templates.limits.rules.useCount.loops, () => new BBTagRuntimeError('Max safeloops reached')))
            .addRules('dump', new UseCountRule(5));
    }
}
