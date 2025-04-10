import { check, sleep } from "k6";
import {
   loadPackage,
   queryPackage,
   sampleNames,
   unloadPackage,
} from "./common.ts";

/**
 * Stress Test - Testing system under extreme load
 *
 * This test pushes the system beyond normal load to identify breaking points
 * and understand system behavior under stress.
 *
 * Default configuration:
 * - 100 virtual users
 * - 10 minutes duration
 * - 95th percentile response time < 2s
 * - Error rate < 10%
 */
export const stressTest: TestPreset = {
   defaultOptions: {
      vus: 100,
      duration: "10m",
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
         sleep(0.05);
      }
   },
};

export const options = stressTest.defaultOptions;

export default stressTest.run;
