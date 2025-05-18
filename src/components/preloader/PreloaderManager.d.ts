export interface Preloader {
    show(): void;
    hide(): void;
    initialize(): void;
}

export interface PreloaderManagerInterface {
    preloader: Preloader | null;
    initialized: boolean;
    initialize(): void;
    show(): void;
    hide(): void;
}

export const preloaderManager: any;