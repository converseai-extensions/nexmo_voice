# Nexmo

## Prerequisites
1. Ensure you have an account with [Converse.AI](http://www.converse.ai/)
2. Converse.AI extensions run on **Node.JS** `v6.11.1` on **Alpine Linux** so ensure your node development environment matches this setup. We recommend installing Node.JS via [Node Version Manager (NVM)](https://github.com/creationix/nvm).
3. Install and Authorize [Converse.AI CLI tool](https://get.converse.ai/v2/docs/converse-ai-cli).

## Install
1. Clone repo
2. Initialize extension by running `converse-cli plugin init` from your project root.
3. Run `npm test` from your project root to ensure everything was initialized correctly.
4. Deploy the plugin to your Converse.AI account by running `converse-cli deploy` from your project root.
5. If there are no errors, the plugin should be available under "User" in the left hand menu of the designer.

## Registration
1. Please follow these [instructions](https://get.converse.ai/v2/docs/nexmo-voice) to setup the plugin.
