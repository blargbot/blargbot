import { Cluster } from '../cluster';
import { BaseCommand } from '../core/command';
import { commandTypes } from '../utils';

export class TagCommand extends BaseCommand {
    public constructor(cluster: Cluster) {
        super(cluster, {
            name: 'tag',
            aliases: ['t'],
            category: commandTypes.GENERAL,
            info: 'Tags are a system of public commands that anyone can create or run, using the BBTag language.\n',
            handler: {
                parameters: '{tagName} {args*}',
                execute: () => '', //(msg, [tagName, ...args]) => '',
                subcommands: {
                    'create|add': {
                        parameters: '{tagName} {content*}',
                        execute: () => '', //(msg, [tagName, ...content]) => '',
                        description: ''
                    },
                    'edit': {
                        parameters: '{tagName} {content*}',
                        execute: () => '', //(msg, [tagName, ...content]) => '',
                        description: ''
                    },
                    'delete|remove': {
                        parameters: '{tagName}',
                        execute: () => '', //(msg, [tagName]) => '',
                        description: ''
                    },
                    'permdelete': {
                        parameters: '{tagName}',
                        execute: () => '', //(msg, [tagName]) => '',
                        description: ''
                    },
                    'set': {
                        parameters: '{tagName} {content*}',
                        execute: () => '', //(msg, [tagName]) => '',
                        description: ''
                    },
                    'rename': {
                        parameters: '{oldName} {newName}',
                        execute: () => '', //(msg, [oldName, newName]) => '',
                        description: ''
                    },
                    'cooldown': {
                        parameters: '{tagName} {duration?:duration}',
                        execute: () => '', //(msg, [tagName, duration]) => '',
                        description: ''
                    },
                    'raw': {
                        parameters: '{tagName}',
                        execute: () => '', //(msg, [tagName]) => '',
                        description: ''
                    },
                    'info': {
                        parameters: '{tagName}',
                        execute: () => '', //(msg, [tagName]) => '',
                        description: ''
                    },
                    'top': {
                        parameters: '',
                        execute: () => '', //(msg) => '',
                        description: ''
                    },
                    'author': {
                        parameters: '{tagName}',
                        execute: () => '', //(msg, [tagName]) => '',
                        description: ''
                    },
                    'search': {
                        parameters: '{tagName}',
                        execute: () => '', //(msg, [tagName]) => '',
                        description: ''
                    },
                    'list': {
                        parameters: '{author?}',
                        execute: () => '', //(msg, [author]) => '',
                        description: ''
                    },
                    'favourite|favorite': {
                        parameters: '{tagName}',
                        execute: () => '', //(msg, [tagName]) => '',
                        description: ''
                    },
                    'report': {
                        parameters: '{tagName} {reason+}',
                        execute: () => '', //(msg, [tagName, ...reason]) => '',
                        description: ''
                    },
                    'test|eval|exec|vtest': {
                        parameters: 'debug? {code+}',
                        execute: () => '', //(msg, [debug, ...code]) => '',
                        description: ''
                    },
                    'debug': {
                        parameters: '{tagName} {args*}',
                        execute: () => '', //(msg, [tagName, ...args]) => '',
                        description: ''
                    },
                    'flag': {
                        parameters: '{tagName}',
                        execute: () => '', //(msg, [tagName]) => '',
                        description: '',
                        subcommands: {
                            'create|add': {
                                parameters: '{tagName} {flags+}',
                                execute: () => '', //(msg, [tagName, ...flags]) => '',
                                description: ''
                            },
                            'delete|remove': {
                                parameters: '{tagName} {flags+}',
                                execute: () => '', //(msg, [tagName, ...flags]) => '',
                                description: ''
                            }
                        }
                    },
                    'setlang': {
                        parameters: '{tagName} {language}',
                        execute: () => '', //(msg, [tagName, language]) => '',
                        description: ''
                    }
                }
            }
        });


    }
}