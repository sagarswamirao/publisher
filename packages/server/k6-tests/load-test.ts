import { check, sleep } from "k6";
import {
   loadPackage,
   queryPackage,
   sampleNames,
   unloadPackage,
} from "./common.ts";

/**
 * Load Test - Testing system under normal load
 *
 * This test verifies system performance under expected normal load conditions.
 * It simulates multiple concurrent users to ensure the system handles typical traffic.
 *
 * Default configuration:
 * - 50 virtual users
 * - 5 minutes duration
 * - 95th percentile response time < 1s
 * - Error rate < 5%
 */
export const loadTest: TestPreset = {
   defaultOptions: {
      vus: 50,
      duration: "5m",
      thresholds: {
         http_req_duration: ["p(95)<1000"],
         http_req_failed: ["rate<0.05"],
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

export const options = loadTest.defaultOptions;
export default loadTest.run;
