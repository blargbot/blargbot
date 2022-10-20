import { Guild } from 'eris';

import { BBTagRuntimeError, TooManyLoopsError } from '../errors';
import { GlobalLimit } from './GlobalLimit';
import { disabledRule, UseCountRule } from './rules';

export class TagLimit extends GlobalLimit {
    public constructor(guild?: Guild) {
        super('tagLimit');

        this.addRules('ban', disabledRule)
            .addRules('unban', disabledRule)
            .addRules('guildbans', disabledRule)
            .addRules('kick', disabledRule)
            .addRules('timeout', disabledRule)
            .addRules('modlog', disabledRule)
            .addRules('pardon', disabledRule)
            .addRules('warn', disabledRule)
            .addRules('reason', disabledRule)
            .addRules('slowmode', disabledRule)
            .addRules('roleadd', disabledRule)
            .addRules('rolecreate', disabledRule)
            .addRules('roledelete', disabledRule)
            .addRules('roleremove', disabledRule)
            .addRules('rolesetmentionable', disabledRule)
            .addRules('rolesetperms', disabledRule)
            .addRules('rolesetposition', disabledRule)
            .addRules('guildseticon', disabledRule)
            .addRules('emojicreate', disabledRule)
            .addRules('emojidelete', disabledRule)
            .addRules('channelcreate', disabledRule)
            .addRules('channeldelete', disabledRule)
            .addRules('channeledit', disabledRule)
            .addRules('channelsetperms', disabledRule)
            .addRules('channelsetpos', disabledRule)
            .addRules('threadcreate', disabledRule)
            .addRules('deletethread', disabledRule)
            .addRules('dm', disabledRule)
            .addRules('send', disabledRule)
            .addRules('timer', disabledRule)
            .addRules('usersetnick', disabledRule)
            .addRules('edit', new UseCountRule(10))
            .addRules('delete', new UseCountRule(16))
            .addRules('reactremove', new UseCountRule(10))
            .addRules('reactremove:requests', new UseCountRule(40, 'requests', 'Request'))
            .addRules('waitmessage', new UseCountRule(5))
            .addRules('waitreaction', new UseCountRule(20))
            .addRules([
                'for:loops',
                'repeat:loops',
                'while:loops'
            ], new UseCountRule(10000, 'loops', () => new TooManyLoopsError(10000)))
            .addRules('foreach:loops', new UseCountRule((guild?.memberCount ?? 0) + 100000, 'loops', () => new TooManyLoopsError(100000)))
            .addRules('map:loops', new UseCountRule((guild?.memberCount ?? 0) + 100000, 'loops', () => new TooManyLoopsError(100000)))
            .addRules('filter:loops', new UseCountRule((guild?.memberCount ?? 0) + 100000, 'loops', () => new BBTagRuntimeError('Max safeloops reached')))
            .addRules('dump', new UseCountRule(5));
    }

}
