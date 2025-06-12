import Phaser from 'phaser';

// This creates a single, shared instance of Phaser's event emitter.
// Any part of our app that imports this file will be using the exact same instance,
// which is crucial for communication.
const EventBus = new Phaser.Events.EventEmitter();

export default EventBus;
