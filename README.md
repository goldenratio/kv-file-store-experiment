# kv-file-store-experiment


# How To Run

- `npm i` - Install dependencies
- `npm run build` - runs tests

**Command Line Arguments:**

- `-concurrentOperations` : `{number}` use this flag to configure number of concurrent operations
- `-useMainThread` : `{boolean}` use this flag to run I/O operations on main process or in worker process

**Example:**

`npm run build -- -concurrentOperations=1 -useMainThread=true`

