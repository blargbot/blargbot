import type { BBTagPluginType } from './BBTagPluginType.js';

export type BBTagPluginInstance<Type extends BBTagPluginType> = Type extends BBTagPluginType<infer Plugin> ? Plugin : never;
