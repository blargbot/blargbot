import { Logger } from '@core/Logger';
import { mapping } from '@core/utils';
import { BaseApiImageGenerator } from '@image/BaseApiImageGenerator';
import { TheSearchOptions } from 'blargbot-api';

export class TheSearchGenerator extends BaseApiImageGenerator<'thesearch'> {
    public constructor(logger: Logger, config: Configuration) {
        super('thesearch', logger, config.blargbot_api.token, config.blargbot_api.base, mapOptions);
    }
}

const mapOptions = mapping.mapObject<TheSearchOptions>({
    text: mapping.mapString
});
