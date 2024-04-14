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
  private readonly _appStartTime: number = Date.now();
  private _appEndTime: number = Date.now();

  private _fileWriteOperationCount: number = 0;
  private _fileReadOperationCount: number = 0;

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

    if (type === 'set') {
      this._fileReadOperationCount ++;
      this._fileWriteOperationCount ++;
    } else if (type === 'get') {
      this._fileReadOperationCount ++;
    }

    return metricId;
  }

  end(metricId: number, success: boolean, message: string = ''): void {
    const value = this._payload.get(metricId);
    if (value) {
      const startTime = value.startTime;
      this._payload.set(metricId, {... value, ... { timeSpent: Date.now() - startTime, success, message } })
    }
    this._appEndTime = Date.now();
  }

  getLogs(): ReadonlyArray<MetricData> {
    return [... this._payload.values()];
  }

  prettyPrint(): void {
    const logs = this.getLogs();
    const primaryData = {
      average_set_in_milliseconds : 0,
      median_set_in_milliseconds : 0,
      average_get_in_milliseconds : 0,
      median_get_in_milliseconds : 0
    }

    const setOpsTimeSpent = logs
      .filter(data => data.operationType === 'set')
      .map(data => data.timeSpent)
      .sort((a, b) => a - b);

    primaryData.average_set_in_milliseconds = calculateAverage(setOpsTimeSpent);
    primaryData.median_set_in_milliseconds = calculateMedian(setOpsTimeSpent);

    const getOpsTimeSpent = logs
      .filter(data => data.operationType === 'get')
      .map(data => data.timeSpent)
      .sort((a, b) => a - b);

    primaryData.average_get_in_milliseconds = calculateAverage(getOpsTimeSpent);
    primaryData.median_get_in_milliseconds = calculateMedian(getOpsTimeSpent);

    const appRunTimeInSeconds = (this._appEndTime - this._appStartTime) / 1000;
    const numberOfIO = {
      number_of_writes_per_second: this._fileWriteOperationCount / appRunTimeInSeconds,
      number_of_reads_per_second: this._fileReadOperationCount / appRunTimeInSeconds,
    }

    const errorData = {
      error_count_set: 0,
      error_count_get: 0,
    }
    const setOpsErrorCount = logs
      .filter(data => data.operationType === 'set' && !data.success)
      .length;

    const getOpsErrorCount = logs
      .filter(data => data.operationType === 'get' && !data.success)
      .length;


    errorData.error_count_set = setOpsErrorCount;
    errorData.error_count_get = getOpsErrorCount;

    console.table(primaryData);
    console.table(numberOfIO);
    console.table(errorData);
  }
}

function calculateAverage(value: Array<number>): number {
  if (value.length === 0) {
    return 0;
  }

  const sum = value.reduce((total, num) => total + num, 0);
  return Math.round(sum / value.length);
}

function calculateMedian(sortedArr: Array<number>): number {
  if (sortedArr.length === 0) {
    return 0;
  }

  const length = sortedArr.length;
  const middleIndex = Math.floor(length / 2);

  if (length % 2 === 0) {
    return Math.round(((sortedArr[middleIndex - 1] || 0) + (sortedArr[middleIndex] || 0)) / 2);
  } else {
    return sortedArr[middleIndex] || 0;
  }
}
