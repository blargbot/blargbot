import { connectionToService, hostIfEntrypoint, ServiceHost } from '@blargbot/application';
import { fullContainerId } from '@blargbot/container-id';
import env from '@blargbot/env';
import { ImageGenerateMessageBroker } from '@blargbot/image-generator-client';
import type { ConnectionOptions } from '@blargbot/message-hub';
import { MessageHub } from '@blargbot/message-hub';
import { MetricsClient } from '@blargbot/metrics-client';

import ArtGenerator from './generators/art.js';
import type { ApiImageGeneratorConfig } from './generators/base/ApiImageGenerator.js';
import CardsAgainstHumanityGenerator from './generators/cah.js';
import CaptionGenerator from './generators/caption.js';
import ClintGenerator from './generators/clint.js';
import ClippyGenerator from './generators/clippy.js';
import ClydeGenerator from './generators/clyde.js';
import ColorGenerator from './generators/color.js';
import DeleteGenerator from './generators/delete.js';
import DistortGenerator from './generators/distort.js';
import EmojiGenerator from './generators/emoji.js';
import FreeGenerator from './generators/free.js';
import LinusGenerator from './generators/linus.js';
import PCCheckGenerator from './generators/pccheck.js';
import PixelateGenerator from './generators/pixelate.js';
import ShitGenerator from './generators/shit.js';
import SonicSaysGenerator from './generators/sonicsays.js';
import StarVsTheForcesOfGenerator from './generators/starVsTheForcesOf.js';
import StupidGenerator from './generators/stupid.js';
import TheSearchGenerator from './generators/thesearch.js';
import TruthGenerator from './generators/truth.js';
import ImageGeneratorManager from './ImageGeneratorManager.js';

export interface ImageGeneratorApplicationOptions {
    readonly messages: ConnectionOptions;
    readonly api: ApiImageGeneratorConfig;
}

@hostIfEntrypoint(() => [{
    messages: {
        prefetch: env.rabbitPrefetch,
        hostname: env.rabbitHost,
        username: env.rabbitUsername,
        password: env.rabbitPassword
    },
    api: {
        url: env.imageApiUrl,
        token: env.imageApiToken
    }
}])
export class ImageGeneratorApplication extends ServiceHost {
    public constructor(options: ImageGeneratorApplicationOptions) {
        const serviceName = 'image-generator';
        const messages = new MessageHub(options.messages);
        const metrics = new MetricsClient({ serviceName, instanceId: fullContainerId });

        super([
            connectionToService(messages, 'rabbitmq'),
            metrics,
            new ImageGeneratorManager(
                new ImageGenerateMessageBroker(messages, serviceName),
                {
                    art: new ArtGenerator(),
                    cah: new CardsAgainstHumanityGenerator(),
                    caption: new CaptionGenerator(),
                    clint: new ClintGenerator(options.api),
                    clippy: new ClippyGenerator(),
                    clyde: new ClydeGenerator(),
                    color: new ColorGenerator(options.api),
                    delete: new DeleteGenerator(options.api),
                    distort: new DistortGenerator(),
                    emoji: new EmojiGenerator(),
                    free: new FreeGenerator(),
                    linus: new LinusGenerator(options.api),
                    pcCheck: new PCCheckGenerator(options.api),
                    pixelate: new PixelateGenerator(),
                    shit: new ShitGenerator(options.api),
                    sonicSays: new SonicSaysGenerator(options.api),
                    starVsTheForcesOf: new StarVsTheForcesOfGenerator(),
                    stupid: new StupidGenerator(),
                    theSearch: new TheSearchGenerator(options.api),
                    truth: new TruthGenerator()
                }
            )
        ]);
    }
}
