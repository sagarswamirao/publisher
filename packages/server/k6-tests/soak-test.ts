import { check, sleep } from "k6";
import {
   loadPackage,
   unloadPackage,
   queryPackage,
   sampleNames,
} from "./common.ts";

/**
 * Soak Test - Testing system under sustained load
 *
 * This test verifies system stability and performance over an extended period
 * to identify memory leaks, resource exhaustion, or degradation over time.
 *
 * Default configuration:
 * - 10 virtual users
 * - 1 hour duration
 * - 95th percentile response time < 1s
 * - Error rate < 1%
 */
export const soakTest: TestPreset = {
   defaultOptions: {
      vus: 10,
      duration: "1h",
      thresholds: {
         http_req_duration: ["p(95)<1000"],
         http_req_failed: ["rate<0.01"],
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
         sleep(1);
      }
   },
};

export const options = soakTest.defaultOptions;
export default soakTest.run;
