/* ===========================================================================
    Theme actions
=========================================================================== */

// Build files
import config from './config.js';
import {
    copyBuildFolderToSrc,
    copySrcFileToThemeBuild,
    copySrcFolderToBuild,
    removeFileFromThemeBuild,
} from './files.js';
import {
    prefixRootSrcPath,
    prefixSrcPath,
    prefixThemeBuildPath,
} from './helpers.js';

/**
 * Copy the theme file to the build folder
 *
 * @param {string} path The file path
 */
export const copyThemeSrcToBuild = (path) => {
    copySrcFileToThemeBuild(
        path,
        config.data.themeConfig.src,
        config.data.themeConfig.build,
    );
};

/**
 * Removes a deleted theme config file from the build directory
 *
 * @param {string} path The file path
 */
export const removeThemeFileFromBuild = (path) => {
    removeFileFromThemeBuild(path, config.data.themeConfig.build, 'theme file');
};

/**
 * Process the theme request
 *
 * @param {string} action The action to take
 */
export const themeHandler = async (action) => {
    if (action === 'pull') {
        copyBuildFolderToSrc(
            prefixThemeBuildPath(config.data.themeConfig.build),
            prefixSrcPath(config.data.themeConfig.src),
            'theme config files',
        );
    } else if (action === 'push') {
        copySrcFolderToBuild(
            prefixSrcPath(config.data.themeConfig.src),
            prefixThemeBuildPath(config.data.themeConfig.build),
            'theme config files',
        );
    }
};

export default themeHandler;
