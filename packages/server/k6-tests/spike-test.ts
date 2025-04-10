import { check, sleep } from "k6";

import {
   loadPackage,
   queryPackage,
   sampleNames,
   unloadPackage,
} from "./common.ts";

/**
 * Spike Test - Testing system under sudden spikes of load
 *
 * This test simulates sudden traffic spikes to verify system behavior
 * under rapid load changes and recovery capabilities.
 *
 * Default configuration:
 * - Stages:
 *   - 2 minutes ramp-up to 100 users
 *   - 1 minute at 100 users
 *   - 2 minutes ramp-down to 0 users
 * - 95th percentile response time < 2s
 * - Error rate < 10%
 */
export const spikeTest: TestPreset = {
   defaultOptions: {
      stages: [
         { duration: "2m", target: 100 }, // Ramp up to 100 users
         { duration: "1m", target: 100 }, // Stay at 100 users
         { duration: "2m", target: 0 }, // Ramp down to 0 users
      ],
      thresholds: {
         http_req_duration: ["p(95)<2000"],
         http_req_failed: ["rate<0.1"],
      },
   },
   run: () => {
      for (const sampleName of sampleNames) {
         const loadedPackage = loadPackage(sampleName);
         check(queryPackage(loadedPackage.id), {
            [`package ${sampleName} uploaded`]: (p) => p?.status === "serving",
         });
         unloadPackage(sampleName, loadedPackage.id);
         check(queryPackage(loadedPackage.id), {
            [`package ${sampleName} unloaded`]: (p) => p === null,
         });
         sleep(0.1);
      }
   },
};

export const options = spikeTest.defaultOptions;

export default spikeTest.run;
