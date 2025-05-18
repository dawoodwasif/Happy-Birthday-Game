import { HeartPreloader } from './HeartPreloader';

class PreloaderManager {
    constructor() {
        this.preloader = null;
        this.initialized = false;
    }

    initialize() {
        if (this.initialized) return;
        this.preloader = new HeartPreloader('preloader');
        this.initialized = true;
    }

    show() {
        if (!this.initialized) this.initialize();
        this.preloader.show();
    }

    hide() {
        if (!this.initialized) return;
        this.preloader.hide();
    }
}

// Singleton pattern - only one preloader instance
export const preloaderManager = new PreloaderManager();