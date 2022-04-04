# Local development

## WSL & VsCode

While this project can be developed on windows, using linux is recommended. This can be achieved on a windows OS by using the [Windows Subsystem for Linux (WSL)](https://docs.microsoft.com/en-us/windows/wsl/install). It is also recommended to use [VSCode](https://code.visualstudio.com/) as there are a bunch of configurations for it included in the repo under the [.vscode](/.vscode/) directory.

### WSL

Setting up WSL is as easy as following the [instructions from Microsoft](https://docs.microsoft.com/en-us/windows/wsl/install).

Once WSL is installed, you will need to install a linux distribution. [Ubuntu](https://www.microsoft.com/p/ubuntu/9pdxgncfsczv) is used in the CI process, so would be a good place to start. Some additional dependencies will also need to be added, which can be found in the `Install build dependencies` step in the [CI definition file](/.github/workflows/main.yml)

#### Files

In order to use the full strength of WSL, it is recommended to clone the project to somewhere inside the WSL file system. While it is possible to have the files on your windows drives, there can be issues that arise as a result.

```cmd
REM cmd.exe
wsl
```

```bash
#!/bin/bash
cd '/path/to/where/you/want/the/repo/to/be'
git clone https://github.com/blargbot/blargbot.git
```

### Node.js

Blargbot has been developed against [Node 16](https://nodejs.org/en/download/package-manager/). This can be installed directly, however there is a useful tool for linux called [nvm](https://github.com/nvm-sh/nvm). Installing this instead of node directly will allow you to manage multiple versions of node incase you want to test against a different version. Follow the info there on how to set it up.

### VSCode

Support for WSL can be added to VSCode through the [official extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.vscode-remote-extensionpack). This will run a VSCode server on your WSL instance, which you can connect to from the windows client, allowing you to use linux commands from windows. To then open the project in VSCode, you will need to use the linux command line.

```cmd
REM cmd.exe
wsl
```

```bash
#!/bin/bash
cd '/path/to/where/you/cloned/the/repo'
code .
```

Once vscode has opened, press `F1` to open the command pallet and search for `Tasks: Manage Automatic Tasks In Folder`. Allowing automatic tasks will cause a process to kick off whenever you open the project in VSCode that will constantly compile the project in the background, meaning you can debug any changes almost instantly.

#### Recommended extensions

There are 3 [recommended extensions](/.vscode/extensions.json) and you should be asked if you want to install them when VSCode opens. If not, you can manually install them. The [zipfs](https://marketplace.visualstudio.com/items?itemName=arcanis.vscode-zipfs) extension is the most important as it will allow you to navigate to typescript definitions of other libraries. This isnt possible without the extension as Yarn PNP stored packages in [zip files](/.yarn/cache/) as opposed to using a `node_modules` directory.

### Windows terminal

If you are using windows terminal, you can add a profile to it for easy access to the blargbot repo. Replace `Ubuntu` with the name of the linux distribution you installed for wsl. To access the `settings.json`, in windows terminal go to `Top right dropdown` > `Settings` > `Open JSON file` (bottom left)

```jsonc
// settings.json

{
    "commandline": "wsl -d Ubuntu",
    "guid": "{2c4de342-38b7-51cf-b940-2309a097f519}",
    "icon": "https://blargbot.xyz/img/blargbotmini.png",
    "name": "Blargbot dev",
    "startingDirectory": "\\\\wsl$\\Ubuntu\\path\\to\\where\\you\\cloned\\the\\repo"
}
```

## Compilation

In order to correctly compile the project, you will need a valid `config.json` file, which isn't included in the project. This file is only needed when attempting to run the project, but to run the tests it is sufficient to mock it out with a declaration file

```ts
// config.json.d.ts

declare const config: import('./src/config/Configuration').Configuration;
export = config;
```

## Testing

Tests are run by mocha, and can be started by running `yarn test`. If you wish to also get a code coverage report, you can run `yarn coverage`. This will generate a `/coverage/index.html` file that contains all the coverage details for the [bbtag](/src/bbtag/) folder.
