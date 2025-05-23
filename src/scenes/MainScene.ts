import { Dialog, DoorState, LevelMap, LevelSprite } from '@src/components';
import { MusicPlaylist } from '@src/components/MusicPlaylist';
import { Player } from '@src/entities';

import { LevelScene } from './LevelScene';

export class MainScene extends LevelScene {
	private player: Player;
	private map: LevelMap;
	private dialog: Dialog;
	private giftsCount: number;
	private musicPlaylist: MusicPlaylist;

	constructor() {
		super({ key: 'MainScene' });

		this.dialog = new Dialog();
		this.player = new Player({ scene: this });
		this.map = new LevelMap({ scene: this });
		this.musicPlaylist = new MusicPlaylist();
		this.musicPlaylist.play();
	}

	public preload() {
		console.log('MainScene preload started');

		try {
			super.preload();
			this.map.preload();
			this.player.preload();
		} catch (error) {
			console.error('Error during game preloading:', error);
		}

		// Add loading complete event
		this.load.on('complete', () => {
			console.log('Game assets loading complete');
		});
	}

	public create() {
		console.log('MainScene create started');

		try {
			super.create();
			this.map.create();
			this.player.create({ position: this.map.getStartPosition() });
			this.addColliders();
		} catch (error) {
			console.error('Error during game scene creation:', error);
		}

		// Hide the preloader when the scene is created
		try {
			const { preloaderManager } = require('../components/preloader');
			// Add a small delay to make sure everything is rendered
			setTimeout(() => {
				console.log('Hiding preloader from MainScene');
				preloaderManager.hide();
			}, 1000);
		} catch (error) {
			console.error('Error hiding preloader:', error);
		}
	}

	public update(time: number, delta: number) {
		this.map.update();
		this.player.update();
	}

	private addColliders() {
		this.physics.add.collider(this.map.platforms, this.player.sprite);
		this.physics.add.collider(this.map.platformObjects, this.player.sprite);
		this.physics.add.collider(this.map.doors.sprites, this.player.sprite);

		this.physics.add.collider(
			this.map.doors.questionAreas,
			this.player.sprite,
			this.handlePlayerCollidesQuestion
		);

		this.physics.add.collider(
			this.map.doors.loveChest.sprite,
			this.player.sprite,
			this.handlePlayerCollidesChest
		);
	}

	private handlePlayerCollidesQuestion = async (
		question: Phaser.GameObjects.GameObject
	) => {
		if (this.dialog.isOpened) return;

		const area = question as LevelSprite;
		const index = +area.levelObject.type;
		const door = this.map.doors.sprites[index];
		if (door.state === DoorState.opened) return;

		area.body.checkCollision.none = true;
		this.player.toggleFreeze(true);
		const count = await this.dialog.openDialog(index);
		this.map.doors.openDoor(door);
		this.player.toggleFreeze(false);

		if (typeof count === 'number') {
			this.giftsCount = count;
		}
	}

	private handlePlayerCollidesChest = async () => {
		await this.map.doors.loveChest.open(this.giftsCount);
	}
}
