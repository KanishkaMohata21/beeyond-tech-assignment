const { withAndroidManifest } = require('expo/config-plugins');

/**
 * Expo config plugin that explicitly sets android:usesCleartextTraffic="true"
 * on the <application> tag in AndroidManifest.xml.
 *
 * This ensures plain HTTP traffic (non-HTTPS) is allowed on all Android
 * versions and OEM variants, which is required when the backend API
 * uses HTTP (e.g. http://54.159.25.138:5000).
 */
module.exports = function withCleartextTraffic(config) {
    return withAndroidManifest(config, (config) => {
        const androidManifest = config.modResults;
        const application = androidManifest.manifest.application;

        if (application && application.length > 0) {
            application[0].$['android:usesCleartextTraffic'] = 'true';
        }

        return config;
    });
};
