import { guildSettings } from '../constants';

export function isGuildSetting(key: string): key is keyof typeof guildSettings {
    return key in guildSettings;
}

