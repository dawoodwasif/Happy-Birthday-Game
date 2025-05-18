import { HeartPreloader } from './HeartPreloader';

class PreloaderManager {
    private preloader: HeartPreloader | null = null;
    private preloaderContainer: HTMLElement | null = null;
    private initialized: boolean = false;

    constructor() {
        console.log('PreloaderManager constructor');
        // Initialize immediately if document is already loaded
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            setTimeout(() => this.init(), 0);
        } else {
            // Create and initialize on DOMContentLoaded
            document.addEventListener('DOMContentLoaded', () => {
                this.init();
            });
        }
    }

    private init() {
        console.log('PreloaderManager init');
        if (this.initialized) return;
        this.initialized = true;

        this.preloaderContainer = document.getElementById('preloader');
        if (!this.preloaderContainer) {
            console.error('Preloader container not found');
            return;
        }

        // Add styles to preloader container
        this.preloaderContainer.style.position = 'fixed';
        this.preloaderContainer.style.top = '0';
        this.preloaderContainer.style.left = '0';
        this.preloaderContainer.style.width = '100%';
        this.preloaderContainer.style.height = '100%';
        this.preloaderContainer.style.backgroundColor = 'rgba(0, 0, 0, 1)';
        this.preloaderContainer.style.zIndex = '9999';
        this.preloaderContainer.style.display = 'flex';
        this.preloaderContainer.style.alignItems = 'center';
        this.preloaderContainer.style.justifyContent = 'center';
        this.preloaderContainer.style.flexDirection = 'column';

        try {
            this.preloader = new HeartPreloader();
            this.preloader.init();
        } catch (error) {
            console.error('Failed to initialize WebGL preloader:', error);
            // Try to show a fallback message
            this.showFallbackLoader();
        }
    }

    private showFallbackLoader() {
        if (!this.preloaderContainer) return;

        const loadingText = document.createElement('div');
        loadingText.innerText = 'Loading...';
        loadingText.style.color = 'white';
        loadingText.style.fontFamily = 'Arial, sans-serif';
        loadingText.style.fontSize = '24px';

        const birthdayText = document.createElement('div');
        birthdayText.innerText = '';
        birthdayText.style.fontSize = '32px';
        birthdayText.style.marginBottom = '20px';
        birthdayText.style.color = '#ff3366';

        this.preloaderContainer.appendChild(birthdayText);
        this.preloaderContainer.appendChild(loadingText);
    }

    public show() {
        console.log('PreloaderManager show');
        if (this.preloaderContainer) {
            this.preloaderContainer.style.display = 'flex';
            this.preloaderContainer.style.opacity = '1';

            if (!this.preloader) {
                try {
                    this.preloader = new HeartPreloader();
                    this.preloader.init();
                } catch (error) {
                    console.error('Error showing heart preloader:', error);
                    this.showFallbackLoader();
                }
            }
        } else {
            console.error('Preloader container not found when showing');
        }
    }

    public hide() {
        console.log('PreloaderManager hide');
        if (this.preloaderContainer) {
            // Add fade-out animation
            this.preloaderContainer.style.transition = 'opacity 0.8s ease-out';
            this.preloaderContainer.style.opacity = '0';

            setTimeout(() => {
                if (this.preloaderContainer) {
                    this.preloaderContainer.style.display = 'none';

                    // Stop the preloader animation
                    if (this.preloader) {
                        this.preloader.stop();
                        this.preloader = null;
                    }
                }
            }, 800);
        } else {
            console.error('Preloader container not found when hiding');
        }
    }
}

// Create singleton instance
export const preloaderManager = new PreloaderManager();