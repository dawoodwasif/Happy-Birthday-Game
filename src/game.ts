import 'phaser';

// Import preloader first to ensure it's initialized before the game starts
import './components/preloader';

import { MainScene } from './scenes/MainScene';

// Make sure window is available (for browser environment)
if (typeof window !== 'undefined') {
  console.log('Initializing game');

  // Wait a brief moment to ensure DOM elements are ready
  setTimeout(() => {
    try {
      const config: GameConfig = {
        type: Phaser.AUTO,
        width: window.innerWidth,
        height: window.innerHeight,
        input: { keyboard: true },
        parent: 'phaser-game',
        physics: {
          arcade: {
            debug: false,
            gravity: { y: 1850 }
          },
          default: 'arcade'
        },
        scale: {
          width: 1536,
          height: 864,
          autoCenter: Phaser.Scale.CENTER_BOTH,
          autoRound: true,
          mode: Phaser.Scale.FIT,
          zoom: window.innerWidth / 1536
        },
        scene: [MainScene],
        render: {
          antialias: false,
          pixelArt: true,
          roundPixels: true,
          powerPreference: 'high-performance'
        }
      };

      const game = new Phaser.Game(config);
      console.log('Game instance created');
    } catch (error) {
      console.error('Failed to create game instance:', error);
    }
  }, 100);
}
