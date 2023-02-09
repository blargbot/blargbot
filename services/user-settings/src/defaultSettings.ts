import type { UserSettings } from './UserSettings.js';

export const defaultSettings = (): UserSettings => ({
    dontDmErrors: false,
    prefixes: [],
    timezone: null
});
