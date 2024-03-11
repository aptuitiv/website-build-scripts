/* ===========================================================================
    Package JSON actions
=========================================================================== */

import chalk from 'chalk';
import fancyLog from 'fancy-log';
import fs from 'fs-extra';
import logSymbols from 'log-symbols';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

// Build scripts
import { setupRoot } from './helpers.js';

// Get the directory name of the current module
// eslint-disable-next-line no-underscore-dangle -- The dangle is used to match the __dirname variable in Node.js
const __dirname = dirname(fileURLToPath(import.meta.url));

// Default license
const defaultLicense = 'Apache-2.0';

// List of dependencies to remove from 'devDependencies' and 'dependencies'
const dependenciesToRemove = [
    '@aptuitiv/eslint-config-aptuitiv',
    '@ronilaukkarinen/gulp-stylelint',
    'autoprefixer',
    'basic-ftp',
    'chalk',
    'cssnano',
    'del',
    'dotenv',
    'eslint-plugin-import',
    'fancy-log',
    'glob-watcher',
    'gulp',
    'gulp-cached',
    'gulp-changed',
    'gulp-changed-in-place',
    'gulp-concat',
    'gulp-connect',
    'gulp-data',
    'gulp-eslint',
    'gulp-header',
    'gulp-html-beautify',
    'gulp-htmlmin',
    'gulp-if',
    'gulp-image',
    'gulp-imagemin',
    'gulp-newer',
    'gulp-plumber',
    'gulp-postcss',
    'gulp-remember',
    'gulp-rename',
    'gulp-sequence',
    'gulp-svgmin',
    'gulp-svgstore',
    'gulp-tap',
    'gulp-terser',
    'gulp-uglify',
    'gulp-using',
    'merge-stream',
    'moment',
    'penthouse',
    'pixrem',
    'postcss',
    'postcss-bem-linter',
    'postcss-calc',
    'postcss-color-function',
    'postcss-custom-media',
    'postcss-custom-properties',
    'postcss-import',
    'postcss-pseudoelements',
    'require-glob',
    'run-sequence',
    'stylelint',
    'stylelint-order',
    'stylelint-selector-bem-pattern',
];

/**
 * Remove unnecessary dependencies
 *
 * @param {object} currentDependencies The current dependencies from the package.json file
 * @returns {object}
 */
const getDependencies = (currentDependencies) => {
    const dependencies = currentDependencies || {};
    dependenciesToRemove.forEach((item) => {
        delete dependencies[item];
    });
    return dependencies;
};

/**
 * Remove unnecessary dev dependencies and add the necessary ones
 *
 * @param {object} currentDevDependencies The current dev dependencies from the package.json file
 * @returns {object}
 */
const getDevDependencies = (currentDevDependencies) => {
    const thisPackageJson = fs.readJsonSync(`${__dirname}/../package.json`);
    const add = {
        '@aptuitiv/website-build-tools': `^${thisPackageJson.version}`,
    };

    const dependencies = currentDevDependencies || {};
    dependenciesToRemove.forEach((item) => {
        delete dependencies[item];
    });
    return { ...dependencies, ...add };
};

/**
 * Get the scripts for the package.json file
 *
 * @param {object} currentScripts The current scripts from the package.json file
 * @returns {object}
 */
const getScripts = (currentScripts) => {
    const scripts = currentScripts || {};
    // Scripts to remove
    const remove = [
        'updateBrowsersList',
    ];
    // Scripts to make sure that they exists
    const add = {
        build: 'aptuitiv-build build',
        copy: 'aptuitiv-build copy',
        css: 'aptuitiv-build css',
        deploy: 'aptuitiv-build upload -t',
        'download-theme': 'aptuitiv-build download -t',
        export: 'aptuitiv-build export',
        fonts: 'aptuitiv-build push-fonts',
        icons: 'aptuitiv-build icons',
        images: 'aptuitiv-build images',
        init: 'aptuitiv-build init',
        js: 'aptuitiv-build js',
        jslint: 'aptuitiv-build jslint',
        start: 'aptuitiv-build start',
        stylelint: 'aptuitiv-build stylelint',
        templates: 'aptuitiv-build push-templates',
        'theme-config': 'aptuitiv-build push-theme-config',
        'upload-theme': 'aptuitiv-build upload -t',
        watch: 'aptuitiv-build watch',
    };
    remove.forEach((item) => {
        delete scripts[item];
    });
    return { ...scripts, ...add };
};

/**
 * Set up the scripts in the package.json file
 */
const setupPackageJsonScripts = async () => {
    // Get the package.json file
    const packageJson = await fs.readJson('package.json');

    // Get the correct scripts
    packageJson.scripts = getScripts(packageJson.scripts);

    // Write the updated package.json back to the file
    fs.writeJSONSync('package.json', packageJson, { spaces: 4 });
    fancyLog(logSymbols.success, chalk.green('Updated the scripts in the package.json file'));
};

/**
 * Format the package.json file
 *
 * This orders the package.json file contents, sets the correct license, updates the scripts, and
 * sets the correct dev dependencies.
 *
 * @param {object} args The arguments from the command line
 */
export const formatPackageJson = async (args) => {
    const license = args.license || defaultLicense;
    // Get the package.json file
    const packageJson = await fs.readJson('package.json');
    // Format the package.json file
    const sections = [
        'name',
        'version',
        'description',
        'author',
        'copyright',
        'license',
        'private',
        'bugs',
        'browserslist',
        'scripts',
        'devDependencies',
        'dependencies',
        'engines',
        'type',
    ];

    const newPackageJson = {};
    sections.forEach((section) => {
        if (typeof packageJson[section] !== 'undefined') {
            switch (section) {
                case 'browserslist':
                    newPackageJson.browserslist = [
                        '> 0.5%',
                        'last 2 years',
                        'Firefox ESR',
                        'not dead',
                    ];
                    break;
                case 'dependencies':
                    newPackageJson.dependencies = getDependencies(packageJson.dependencies);
                    break;
                case 'devDependencies':
                    newPackageJson.devDependencies = getDevDependencies(packageJson.devDependencies);
                    break;
                case 'engines':
                    newPackageJson.engines = {
                        node: '^12.20.0 || ^14.13.1 || >=16.0.0',
                    };
                    break;
                case 'license':
                    newPackageJson[section] = license;
                    break;
                case 'scripts':
                    newPackageJson.scripts = getScripts(packageJson.scripts);
                    break;
                case 'type':
                    newPackageJson.type = 'module';
                    break;
                default:
                    newPackageJson[section] = packageJson[section];
            }
        }
    });

    fs.writeJSONSync('package.json', newPackageJson, { spaces: 4 });
    fancyLog(logSymbols.success, chalk.green('Updated the package.json file'));
};

/**
 * Set up the license file to go with the license in the package.json file
 *
 * @param {object} args The command line arguments.
 *  - license: The license to use
 */
export const setupLicense = (args) => {
    const license = args.license || defaultLicense;
    if (license === 'Apache-2.0') {
        // Copy the LICENSE file
        const licenseContent = fs.readFileSync(`${__dirname}/lib/apache-license.txt`);
        fs.writeFileSync('LICENSE', licenseContent);
    }
};

/**
 * Process the package-json request
 *
 * @param {object} args The command line arguments
 * @param {string} action The action to take
 */
export const packageJsonHandler = async (args, action) => {
    setupRoot(args.root);
    if (action === 'format') {
        await formatPackageJson(args);
        setupLicense(args);
    } else if (action === 'scripts') {
        await setupPackageJsonScripts();
    }
};
