import { Logger } from '@core/Logger';
import { mapping } from '@core/utils';
import { BaseApiImageGenerator } from '@image/BaseApiImageGenerator';
import { ColorOptions } from 'blargbot-api';

export class ColorGenerator extends BaseApiImageGenerator<'color'> {
    public constructor(logger: Logger, config: Configuration) {
        super('color', logger, config.blargbot_api.token, config.blargbot_api.base, mapOptions);
    }
}

const mapOptions = mapping.mapObject<ColorOptions>({
    color: mapping.mapArray(mapping.mapString)
});
