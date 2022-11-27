[![Crowdin](https://badges.crowdin.net/blargbot/localized.svg)](https://crowdin.com/project/blargbot)

# blargbot

blargbot is multipurpose discord bot. Coded in node.js using [Eris](https://github.com/abalabahaha/eris), blargbot hopes to bring commands and services to your discord.

Excuse the mess! blargbot is currently undergoing a rolling rewrite.

## Commands

blargbot is equipped with numerous commands, which are detailed [here](https://blargbot.xyz/commands).

## Tags

blargbot has a comprehensive [tag system](https://blargbot.xyz/tags/) for making your own complex commands.

## Moderation

blargbot has a built-in modlogging system, as well as commands to ban, unban, kick, mute, and unmute rowdy users. It also keeps extensive logs about user messages, which are available to you upon command.

## Open-Sourced

blargbot is completely open-source under the [GNU AGPLv3 License](https://github.com/blargbot/blargbot/blob/master/LICENSE.MD). Feel free to take a look and learn how everything works. If you use any of my code in your own project, you are required to credit me. See the license for more details.

## Open To Suggestions

Have a suggestion for the bot? I would be glad to hear it! Found a bug? I'd like to hear that too! You can suggest anything to me using the `suggest` command, by [joining my guild](https://discord.gg/015GVxZxI8rtlJgXF), or by [submitting a ticket](https://github.com/blargbot/blargbot/issues).

## Note

Open-source does not mean portable or self-hostable. The reason it's open-source is so people can look at it's internals and learn how it works; for educational purposes. Hosting it yourself is not supported.

If you're planning on hosting it yourself, I can't say that I'll approve, but I won't stop you either. My requirements for this include giving me the heads-up and crediting [@stupid cat](https://github.com/Ratismal) as the original author. See the license for more details.

## Contributing

If you want to contribute to blargbot, it's very easy using a tool like [VSCode](https://code.visualstudio.com/). To get started, all you need to do is ensure you have followed the [setup steps for VSCode dev containers](https://code.visualstudio.com/docs/devcontainers/containers#_getting-started). Once that is all set up, within VSCode, open the [command pallet](https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette) and search for the `Clone Repository in Container Volume` option. Enter the github repository url into the input box (https://github.com/blargbot/blargbot.git) and it will do everything you need!

Once everything is set up by the dev containers, you will need to follow the instructions in [config.example.jsonc](./config.example.jsonc) to set up the config to run the bot.

Now you will be able to run and debug the bot at any time by running the `node: master` or `node: cluster` launch profiles. `node: cluster` is generally better, as the master worker will kill clusters that dont respond for a certain period of time, which can make breakpoints harder to use. `node: master` is closest to how the deployed bot actually runs however, so if youre working on the wider architecture of the bot then that is what you should run.