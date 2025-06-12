import Phaser from 'phaser';

const EventBus = new Phaser.Events.EventEmitter();

// ✨ NEW: Add a unique ID to this specific instance
EventBus.id = Date.now() + Math.random();
console.log(`EventBus instance created with ID: ${EventBus.id}`);

export default EventBus;
