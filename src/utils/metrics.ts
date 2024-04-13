let metricId: number = 0;

export interface MetricData {
  readonly metricId: number;
  readonly operationType: 'set' | 'get';
  readonly startTime: number;
  readonly timeSpent: number;
  readonly success: boolean;
  readonly message: string;
}

export class Metrics {
  private readonly _payload = new Map<number, MetricData>();

  begin(type: 'set' | 'get'): number {
    metricId ++;
    this._payload.set(metricId, {
      metricId: metricId,
      operationType: type,
      startTime: Date.now(),
      timeSpent: Infinity,
      success: false,
      message: ''
    });
    return metricId;
  }

  end(metricId: number, success: boolean, message: string = ''): void {
    const value = this._payload.get(metricId);
    if (value) {
      const startTime = value.startTime;
      this._payload.set(metricId, {... value, ... { timeSpent: Date.now() - startTime, success, message } })
    }
  }

  getLogs(): ReadonlyArray<MetricData> {
    return [... this._payload.values()];
  }
}
