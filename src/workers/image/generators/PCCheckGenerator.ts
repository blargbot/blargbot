import { Logger } from '@core/Logger';
import { mapping } from '@core/utils';
import { BaseApiImageGenerator } from '@image/BaseApiImageGenerator';
import { PCCheckOptions } from 'blargbot-api';

export class PCCheckGenerator extends BaseApiImageGenerator<'pccheck'> {
    public constructor(logger: Logger, config: Configuration) {
        super('pccheck', logger, config.blargbot_api.token, config.blargbot_api.base, mapOptions);
    }
}

const mapOptions = mapping.mapObject<PCCheckOptions>({
    text: mapping.mapString
});
