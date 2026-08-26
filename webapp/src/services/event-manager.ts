import type AppEvents from "@/constants/app-events";
import type { ValueOf } from "@/lib/ts-helpers";

type AppEventName = ValueOf<typeof AppEvents>;

type AppEventMap = Record<string, CallableFunction[]>;

class EventManager {
  private map: AppEventMap = {};

  public subscribe(events: AppEventName | AppEventName[], fn: CallableFunction) {
    const evts = Array.isArray(events) ? events : [events];
    const unsubs = evts.map((ev) => this.assign(ev, fn));
    return this.unsubscribe.bind(this, unsubs);
  }

  public fire(event: AppEventName, ...args: unknown[]) {
    if (!this.map[event] || this.map[event].length < 1) {
      console.warn(`NO LISTENERS FOR EVENT: "${event}"`);
      return;
    }
    args.push(event);
    this.map[event].forEach((fn) => {
      fn(...args);
    });
  }

  private assign(event: AppEventName, fn: CallableFunction): CallableFunction {
    if (!this.map[event]) {
      this.map[event] = [];
    }
    this.map[event].push(fn);
    return this.unassign.bind(this, event, fn);
  }

  private unassign(event: AppEventName, fn: CallableFunction): void {
    if (!this.map[event]) {
      return;
    }

    const index = this.map[event].indexOf(fn);
    if (index > -1) {
      delete this.map[event][index];
      this.map[event].splice(index, 1);
    }
  }

  private unsubscribe(unsubs: CallableFunction[]) {
    unsubs.forEach((fn) => {
      fn();
    });
  }
}

const eventManager = new EventManager();

export default eventManager;
