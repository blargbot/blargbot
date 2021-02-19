import { StoredGuildSettings } from '../../../core/database';
import { guildSettings } from '../../constants';

export function isGuildSetting(key: string): key is keyof StoredGuildSettings {
    return key in guildSettings;
}