import { BaseRuntimeLimit } from './BaseRuntimeLimit.js';
import type { limits } from './index.js';
import { DisabledInRule } from './rules/index.js';

export abstract class GlobalLimit extends BaseRuntimeLimit {
    public constructor(name: keyof typeof limits) {
        super(name);

        this.addRules(
            [
                // API subtags
                'dm',
                'send',
                'edit',
                'delete',
                'kick',
                'timeout',
                'ban',
                'reactadd',
                'reactremove',
                'roleadd',
                'rolecreate',
                'roledelete',
                'roleremove',
                'rolesetmentionable',
                'webhook',

                // Moderation subtags
                'warn',
                'modlog',
                'pardon',

                // Misc subtags
                'embed',
                'waitmessage',
                'waitreact',
                'sleep'
            ],
            new DisabledInRule('filter', 'waitmessage', 'waitreaction')
        );
    }
}
