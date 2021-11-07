import { BaseRuntimeLimit } from './BaseRuntimeLimit';
import { limits } from './index';
import { DisabledInRule } from './rules';

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
            new DisabledInRule('filter'),
            new DisabledInRule('waitmessage'),
            new DisabledInRule('waitreaction')
        );
    }
}
