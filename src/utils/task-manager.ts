import { noop } from './file-utils.js';
import {clearTimeout} from "node:timers";

let taskIndex = 0;

interface TaskType<T = unknown> {
  readonly taskId: string;
  readonly fn: () => Promise<T>;
  readonly taskComplete: (value: T) => void
}

export class TaskManager {
  private readonly _pendingTasks: Array<TaskType> = [];
  private readonly _activeWorkers = new Set<string>();
  private readonly _schedulerTimeoutIdMap = new Map<string, { id: NodeJS.Timeout; fn :() => Promise<unknown> }>();
  private readonly _concurrentTasks: number;

  constructor(concurrentTasks: number) {
    this._concurrentTasks = concurrentTasks;
  }

  add<T>(fn: () => Promise<T>, onTaskComplete: (value: T) => void = noop): void {
    taskIndex ++;
    const taskId = `task-${taskIndex}`;

    this._pendingTasks.push(<TaskType>{ taskId: taskId, fn: fn , taskComplete: onTaskComplete });
    this.executeNextWorker();
  }

  schedule<T = unknown>(fn: () => Promise<T>, delayInMs: number, key: string, onComplete: (value: T) => void): void {
    const timeoutId = setTimeout(async () => {
       fn().then(v => onComplete(v));
    }, delayInMs);
    this._schedulerTimeoutIdMap.set(key, { id: timeoutId, fn });
  }

  clearSchedule(key: string): void {
    const data = this._schedulerTimeoutIdMap.get(key);
    if (data) {
      const { id, fn } = data;
      clearTimeout(id);
      fn();
      this._schedulerTimeoutIdMap.delete(key);
    }
  }

  private executeNextWorker(): void {
    if (this._pendingTasks.length === 0) {
      return;
    }

    if (this._activeWorkers.size >= this._concurrentTasks) {
      // wait till active workers finish
      return;
    }


    const data = this._pendingTasks.shift();
    if (data) {
      this._activeWorkers.add(data.taskId);
      // console.log('executing worker: ', data.taskId);
      data.fn()
        .then(value => data.taskComplete(value))
        .then(() => {
          this._activeWorkers.delete(data.taskId);
          this.executeNextWorker();
        });
    }

    this.executeNextWorker();
  }
}
