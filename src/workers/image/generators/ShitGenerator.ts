import { Logger } from '@core/Logger';
import { mapping } from '@core/utils';
import { BaseApiImageGenerator } from '@image/BaseApiImageGenerator';
import { ShitOptions } from 'blargbot-api';

export class ShitGenerator extends BaseApiImageGenerator<'shit'> {
    public constructor(logger: Logger, config: Configuration) {
        super('shit', logger, config.blargbot_api.token, config.blargbot_api.base, mapOptions);
    }
}

const mapOptions = mapping.mapObject<ShitOptions>({
    plural: mapping.mapBoolean,
    text: mapping.mapString
});
