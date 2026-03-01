/**
 * Polyfill for fetch specifically for Android on Expo SDK 54.
 * This addresses the "Network Request Failed" bug in Hermes.
 * It uses XMLHttpRequest to implement fetch functionality.
 */
import { Platform } from 'react-native';

if (Platform.OS === 'android') {
    const { polyfillGlobal } = require('react-native/Libraries/Utilities/PolyfillFunctions');

    // We only polyfill if we're on Android and in a production-like environment 
    // where the native fetch might be buggy.
    const whatwgFetch = require('whatwg-fetch');

    if (whatwgFetch) {
        polyfillGlobal('fetch', () => whatwgFetch.fetch);
        polyfillGlobal('Headers', () => whatwgFetch.Headers);
        polyfillGlobal('Request', () => whatwgFetch.Request);
        polyfillGlobal('Response', () => whatwgFetch.Response);
        console.log('✅ Android Fetch Polyfill Applied');
    }
}
