/* ===========================================================================
    Helper functions to initialize the environment
=========================================================================== */

import chalk from 'chalk';
import fancyLog from 'fancy-log';
import fs from 'fs-extra';
import logSymbols from 'log-symbols';
import { parse } from 'path';
import * as readline from 'node:readline/promises';
import yaml from 'json-to-pretty-yaml';

// Build scripts
import { setupRoot } from './helpers.js';
import { isObjectWithValues } from './lib/types.js';

/**
 * Checks to see if the .env and configuration files exist
 *
 * @param {string} configFile The configuration file to check for
 * @returns {object} An object containing the status of the files
 */
const checkForFiles = (configFile) => {
    const returnValue = {
        env: false,
        config: false,
    };
    if (fs.existsSync('.env')) {
        returnValue.env = true;
        fancyLog(logSymbols.success, chalk.green('Found the .env file'));
    }
    if (fs.existsSync(configFile)) {
        returnValue.config = true;
        fancyLog(logSymbols.success, chalk.green('Found the configuration file'), chalk.cyan(configFile));
    }
    return returnValue;
};

/**
 * Convert the JSON content to a Javascript string
 *
 * @param {string} content The JSON content
 * @returns {string}
 */
const convertJsonToJs = (content) => {
    let js = JSON.stringify(content, null, 4);
    // Replace object keys wrapped in quotes to not be in quotes
    js = js.replaceAll('"copy"', 'copy');
    js = js.replaceAll('"src"', 'src');
    js = js.replaceAll('"dest"', 'dest');
    js = js.replaceAll('"javascript"', 'javascript');
    js = js.replaceAll('"bundles"', 'bundles');
    js = js.replaceAll('"build"', 'build');
    js = js.replaceAll('"nodeModules"', 'nodeModules');
    js = js.replaceAll('"files"', 'files');
    // Replace double quotes with single quotes
    js = js.replaceAll('"', "'");
    return js;
};

/**
 * Create the JSON config file
 *
 * @param {string} configFile The configuration file name
 * @param {object} content A JSON object containing different content to write into the file
 */
const createJsonConfigFile = (configFile, content) => {
    const contents = `${JSON.stringify(content, null, 4)}`;
    fs.writeFileSync(configFile, contents);
    fancyLog(logSymbols.success, chalk.green('Config file created'), chalk.cyan(configFile));
};

/**
 * Create the CommonJS config file
 *
 * @param {string} configFile The configuration file name
 * @param {object} content A JSON object containing different content to write into the file
 */
const createCommonJsConfigFile = (configFile, content) => {
    const contents = `/**
 * Configuration for the aptuitiv-build package.
 * See https://github.com/aptuitiv/website-build-tools/blob/main/docs/Configuration.md for more information.
 */
module.exports = ${convertJsonToJs(content)};`;
    fs.writeFileSync(configFile, contents);
    fancyLog(logSymbols.success, chalk.green('Config file created'), chalk.cyan(configFile));
};

/**
 * Create the ES Module config file
 *
 * @param {string} configFile The configuration file name
 * @param {object} content A JSON object containing different content to write into the file
 */
const createEsModuleConfigFile = (configFile, content) => {
    const contents = `/**
 * Configuration for the aptuitiv-build package.
 * See https://github.com/aptuitiv/website-build-tools/blob/main/docs/Configuration.md for more information.
 */
export default ${convertJsonToJs(content)};`;
    fs.writeFileSync(configFile, contents);
    fancyLog(logSymbols.success, chalk.green('Config file created'), chalk.cyan(configFile));
};

/**
 * Create the YAML config file
 *
 * @param {string} configFile The configuration file name
 * @param {object} content A JSON object containing different content to write into the file
 */
const createYamlConfigFile = (configFile, content) => {
    const yamlContent = yaml.stringify(content);
    const contents = `# Configuration for the aptuitiv-build package.
# See https://github.com/aptuitiv/website-build-tools/blob/main/docs/Configuration.md for more information.
${yamlContent}`;
    fs.writeFileSync(configFile, contents);
    fancyLog(logSymbols.success, chalk.green('Config file created'), chalk.cyan(configFile));
};

/**
 * Create the config file
 *
 * @param {string} configFile The config file name
 * @param {object} content An object containing different content to write into the file
 */
export const createConfigFile = (configFile, content) => {
    const configContent = {
        copy: [],
        javascript: {
            bundles: [],
            files: [],
        },
    };
    if (isObjectWithValues(content)) {
        Object.keys(content).forEach((key) => {
            if (key === 'copy') {
                configContent.copy = content.copy;
            } else if (key === 'javascript') {
                if (content.javascript.bundles) {
                    configContent.javascript.bundles = content.javascript.bundles;
                }
                if (content.javascript.files) {
                    configContent.javascript.files = content.javascript.files;
                }
            }
        });
    }
    const { ext } = parse(configFile);
    if (ext === '.json' || configFile === '.aptuitiv-buildrc') {
        createJsonConfigFile(configFile, configContent);
    } else if (ext === '.cjs') {
        createCommonJsConfigFile(configFile, configContent);
    } else if (['.yaml', '.yml'].includes(ext)) {
        createYamlConfigFile(configFile, configContent);
    } else {
        createEsModuleConfigFile(configFile, configContent);
    }
};

/**
 * Create the .env file
 */
const createEnvFile = async () => {
    fancyLog(chalk.magenta('Creating the .env file'));
    fancyLog(chalk.blue('Setting up the FTP credentials. You can get the username and password from the Settings -> Domain / FTP / DNS  section in the website administration.'));
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    const name = await rl.question('What is the name of this website? ');
    const username = await rl.question('What is the FTP username? ');
    const password = await rl.question('What is the FTP password? ');
    rl.close();
    const contents = `# ${name} FTP
FTP_ENVIRONMENT = live
FTP_SERVER = ftp1.branchcms.com
FTP_USERNAME = ${username}
FTP_PASSWORD = ${password} `;
    fs.writeFileSync('.env', contents);
    fancyLog(logSymbols.success, chalk.green('Environment file created'), chalk.cyan('.env'));
};

/**
 * Initialize the environment
 *
 * @param {object} args The command line arguments
 */
export const initialize = async (args) => {
    const configFile = args.config || '.aptuitiv-buildrc.js';
    const files = checkForFiles(configFile);
    if (files.env && files.config) {
        fancyLog(logSymbols.success, chalk.green('The environment is already set up. Go forth and build!'));
    } else {
        if (!files.env) {
            await createEnvFile();
        }
        if (!files.config) {
            createConfigFile(configFile);
        }
        fancyLog(logSymbols.success, chalk.green('All set! Ready for you to build.'));
    }
};

/**
 * Process the initialize request
 *
 * @param {object} args The command line arguments
 */
export const initiaizeHandler = async (args) => {
    setupRoot(args.root);
    await initialize(args);
};
