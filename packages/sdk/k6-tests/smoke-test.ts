import { check, sleep } from "k6";
import { TestPreset } from "./types";
import {
   loadPackage,
   queryPackage,
   unloadPackage,
   sampleNames,
} from "./common.ts";

/**
 * Smoke Test - Basic functionality test with minimal load
 *
 * This test verifies that the system works under minimal load conditions.
 * It uses a single virtual user to ensure basic functionality.
 *
 * Default configuration:
 * - 1 virtual user
 * - 1 minute duration
 * - 95th percentile response time < 500ms
 * - Error rate < 1%
 */
export const smokeTest: TestPreset = {
   defaultOptions: {
      vus: 1,
      duration: "1m",
      thresholds: {
         http_req_duration: ["p(95)<500"],
         http_req_failed: ["rate<0.01"],
      },
   },
   run: () => {
      for (const sampleName of sampleNames) {
         const loadedPackage = loadPackage(sampleName);
         check(queryPackage(loadedPackage.id), {
            [`package ${sampleName} uploaded`]: (p) => p.status === "serving",
         });
         unloadPackage(sampleName, loadedPackage.id);
         check(queryPackage(loadedPackage.id), {
            [`package ${sampleName} unloaded`]: (p) => p === null,
         });
         sleep(1);
      }
   },
};

export const options = smokeTest.defaultOptions;
export default smokeTest.run;
