import type { BBTagPlugin } from './BBTagPlugin.js';

export type BBTagPluginType<Plugin extends BBTagPlugin = BBTagPlugin> = abstract new (...args: never) => Plugin;
