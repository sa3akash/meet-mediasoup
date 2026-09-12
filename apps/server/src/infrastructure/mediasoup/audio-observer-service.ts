import type { Router, AudioLevelObserver, Producer } from "mediasoup/types";
import EventEmitter from "events";

class AudioObserverService extends EventEmitter {
  private observers = new Map<string, AudioLevelObserver>();

  public async setupObserver(roomId: string, router: Router): Promise<AudioLevelObserver> {
    let observer = this.observers.get(roomId);
    if (observer && !observer.closed) return observer;

    observer = await router.createAudioLevelObserver({
      maxEntries: 1,
      threshold: -60, // dBov volume sensitivity
      interval: 350,  // ms evaluation window
    });

    observer.on("volumes", (volumes: Array<{ producer: Producer; volume: number }>) => {
      const highest = volumes[0];
      if (highest) {
        this.emit("activeSpeaker", {
          roomId,
          producerId: highest.producer.id,
          volume: highest.volume,
        });
      }
    });

    observer.on("silence", () => {
      this.emit("silence", { roomId });
    });

    this.observers.set(roomId, observer);
    return observer;
  }

  public async addAudioProducer(roomId: string, producer: Producer): Promise<void> {
    const observer = this.observers.get(roomId);
    if (observer && !observer.closed) {
      await observer.addProducer({ producerId: producer.id });
    }
  }

  public removeObserver(roomId: string): void {
    const observer = this.observers.get(roomId);
    if (observer && !observer.closed) {
      observer.close();
    }
    this.observers.delete(roomId);
  }
}

export const audioObserverService = new AudioObserverService();
