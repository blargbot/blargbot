import type { BBTagProcess } from '../runtime/BBTagProcess.js';
import type { BBTagPluginInstance } from './BBTagPluginInstance.js';
import type { BBTagPluginType } from './BBTagPluginType.js';

export interface BBTagPluginFactory<Type extends BBTagPluginType = BBTagPluginType> {
    readonly type: Type;
    readonly createPlugin: (process: BBTagProcess) => BBTagPluginInstance<Type>;
}
