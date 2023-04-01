import { connectToService, host, isEntrypoint, parallelServices, ServiceHost } from '@blargbot/application';
import { fullContainerId } from '@blargbot/container-id';
import env from '@blargbot/env';
import { ImageGenerateMessageBroker } from '@blargbot/image-generator-client';
import type { ConnectionOptions } from '@blargbot/message-hub';
import { MessageHub } from '@blargbot/message-hub';
import { MetricsPushService } from '@blargbot/metrics-client';
import fetch from 'node-fetch';

import ArtGenerator from './generators/art.js';
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
import ImageGeneratorService from './ImageGeneratorService.js';

export class ImageGeneratorApplication extends ServiceHost {
    public constructor(options: ImageGeneratorApplicationOptions) {
        const serviceName = 'image-generator';
        const hub = new MessageHub(options.messages);

        const requests = new ImageGenerateMessageBroker(hub, serviceName);
        const apiOptions = { ...options.api, fetch };
        const inProcessOptions = { fetch };
        const service = new ImageGeneratorService({
            art: new ArtGenerator(inProcessOptions),
            cah: new CardsAgainstHumanityGenerator(inProcessOptions),
            caption: new CaptionGenerator(inProcessOptions),
            clint: new ClintGenerator(apiOptions),
            clippy: new ClippyGenerator(inProcessOptions),
            clyde: new ClydeGenerator(inProcessOptions),
            color: new ColorGenerator(apiOptions),
            delete: new DeleteGenerator(apiOptions),
            distort: new DistortGenerator(inProcessOptions),
            emoji: new EmojiGenerator(inProcessOptions),
            free: new FreeGenerator(inProcessOptions),
            linus: new LinusGenerator(apiOptions),
            pcCheck: new PCCheckGenerator(apiOptions),
            pixelate: new PixelateGenerator(inProcessOptions),
            shit: new ShitGenerator(apiOptions),
            sonicSays: new SonicSaysGenerator(apiOptions),
            starVsTheForcesOf: new StarVsTheForcesOfGenerator(inProcessOptions),
            stupid: new StupidGenerator(inProcessOptions),
            theSearch: new TheSearchGenerator(apiOptions),
            truth: new TruthGenerator(inProcessOptions)
        });
        super([
            parallelServices(
                connectToService(hub, 'rabbitmq'),
                new MetricsPushService({ serviceName, instanceId: fullContainerId })
            ),
            connectToService(() => requests.handleImageRequest((t, p) => service.generate(t, p)), 'handleImageRequest')
        ]);
    }
}

if (isEntrypoint()) {
    host(new ImageGeneratorApplication({
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
    }));
}

export interface ImageGeneratorApplicationOptions {
    readonly messages: ConnectionOptions;
    readonly api: {
        readonly url: string;
        readonly token: string;
    };
}
