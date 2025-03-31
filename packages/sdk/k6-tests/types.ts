/**
 * Configuration options for K6 tests
 * Can be either a simple test with fixed VUs and duration,
 * or a staged test with varying number of virtual users over time
 */
export type TestOptions = {
   thresholds: {
      http_req_duration?: string[];
      http_req_failed?: string[];
   };
} & (
   | { vus: number; duration: string }
   | { stages: Array<{ duration: string; target: number }> }
);

/**
 * Interface defining a K6 test preset
 */
export interface TestPreset {
   defaultOptions: TestOptions;
   run: () => void;
}
