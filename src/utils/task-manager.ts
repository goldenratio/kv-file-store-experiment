import { noop } from './noop.js';

let taskIndex = 0;

interface TaskType<T = unknown> {
  readonly taskId: string;
  readonly fn: () => Promise<T>;
  readonly taskComplete: (value: T) => void
}

export class TaskManager {
  private readonly _pendingTasks: Array<TaskType> = [];
  private readonly _activeTasks = new Set<string>();
  private readonly _concurrentTasks: number;

  constructor(concurrentTasks: number) {
    this._concurrentTasks = concurrentTasks;
  }

  add<T>(fn: () => Promise<T>, onTaskComplete: (value: T) => void = noop): void {
    taskIndex ++;
    const taskId = `task-${taskIndex}`;

    this._pendingTasks.push(<TaskType>{ taskId: taskId, fn: fn , taskComplete: onTaskComplete });
    this.executeNextTask();
  }

  private executeNextTask(): void {
    if (this._pendingTasks.length === 0) {
      return;
    }

    if (this._activeTasks.size >= this._concurrentTasks) {
      // wait till we have space in activeTasks
      return;
    }

    const data = this._pendingTasks.shift();
    if (data) {
      this._activeTasks.add(data.taskId);
      // console.log('executing worker: ', data.taskId);
      data.fn()
        .then(value => data.taskComplete(value))
        .then(() => {
          this._activeTasks.delete(data.taskId);
          this.executeNextTask();
        });
    }

    this.executeNextTask();
  }
}
