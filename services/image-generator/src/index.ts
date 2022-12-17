import Application from '@blargbot/application';
import env from '@blargbot/env';

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
import type { ImageMessageBrokerOptions } from './ImageMessageBroker.js';
import { ImageMessageBroker } from './ImageMessageBroker.js';

export interface ImageGeneratorApplicationOptions {
    readonly messages: ImageMessageBrokerOptions;
    readonly api: ApiImageGeneratorConfig;
}

@Application.hostIfEntrypoint(() => [{
    messages: {
        hostname: env.rabbitHost,
        username: env.rabbitUsername,
        password: env.rabbitPassword
    },
    api: {
        url: env.imageApiUrl,
        token: env.imageApiToken
    }
}])
export class ImageGeneratorApplication extends Application {
    readonly #messages: ImageMessageBroker;
    readonly #generators: ImageGeneratorManager;

    public constructor(options: ImageGeneratorApplicationOptions) {
        super();

        this.#messages = new ImageMessageBroker(options.messages);
        this.#generators = new ImageGeneratorManager(this.#messages, {
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
            pccheck: new PCCheckGenerator(options.api),
            pixelate: new PixelateGenerator(),
            shit: new ShitGenerator(options.api),
            sonicsays: new SonicSaysGenerator(options.api),
            starvstheforcesof: new StarVsTheForcesOfGenerator(),
            stupid: new StupidGenerator(),
            thesearch: new TheSearchGenerator(options.api),
            truth: new TruthGenerator()
        });
    }

    protected override async start(): Promise<void> {
        await this.#messages.connect();
        await this.#generators.start();
    }

    protected override async stop(): Promise<void> {
        await this.#generators.stop();
        await this.#messages.disconnect();
    }
}
