import { check, sleep } from "k6";
import {
   loadPackage,
   queryPackage,
   unloadPackage,
   getPackages,
} from "./common.ts";
import http from "k6/http";

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

const PUBLISHER_URL = __ENV.PUBLISHER_URL || "http://localhost:4000";

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
      const packages = getPackages();
      for (const pkg of packages) {
         check(queryPackage(pkg.name), {
            [`${pkg.name} loaded in memory`]: (p) => p?.name === pkg.name,
         });
         const modelsResponse = http.get(
            `${PUBLISHER_URL}/api/v0/projects/home/packages/${pkg.name}/models`,
         );

         check(modelsResponse, {
            [`${pkg.name} models available`]: (r) => r.status === 200,
            [`${pkg.name} models list query response time < 50ms`]: (r) =>
               r.timings.duration < 50,
         });

         const models = modelsResponse.json() as Array<{
            path: string;
            type: string;
         }>;
         check(models, {
            "models list is not empty": (m) => m.length > 0,
         });
      }
      sleep(1);
   },
};

export const options = smokeTest.defaultOptions;
export default smokeTest.run;
