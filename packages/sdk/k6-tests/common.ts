import http from "k6/http";
import { check } from "k6";
// @ts-ignore
import { uuidv4 } from "https://jslib.k6.io/k6-utils/1.4.0/index.js";

type ApiPackage = {
   id: string;
   loadTimestamp: number;
   status: "loading" | "serving" | "unloading";
};

const samples = {
   auto_recalls: open("../dist/auto_recalls.zip", "b"),
   ecommerce: open("../dist/ecommerce.zip", "b"),
   faa: open("../dist/faa.zip", "b"),
   ga4: open("../dist/ga4.zip", "b"),
   imdb: open("../dist/imdb.zip", "b"),
   names: open("../dist/names.zip", "b"),
   patterns: open("../dist/patterns.zip", "b"),
   bq_ga4: open("../dist/bq_ga4.zip", "b"),
   bq_ga_sessions: open("../dist/bq_ga_sessions.zip", "b"),
   bq_hackernews: open("../dist/bq_hackernews.zip", "b"),
   bq_the_met: open("../dist/bq_the_met.zip", "b"),
};
type SampleName = keyof typeof samples;
export const sampleNames = Object.keys(samples) as SampleName[];

const SIDECAR_URL = __ENV.SIDECAR_URL || "http://localhost:4001";

export const loadPackage = (packageName: SampleName) => {
   const apiPackage: ApiPackage = {
      id: uuidv4(),
      loadTimestamp: new Date().getTime(),
      status: "loading",
   };
   const formData = {
      package: JSON.stringify(apiPackage),
      connectionList: JSON.stringify({
         connections: [
            {
               connectionConfigJson: JSON.stringify({}),
            },
         ],
      }),
      packageFile: http.file(samples[packageName], packageName + ".zip"),
   };

   const response = http.post(`${SIDECAR_URL}/packages`, formData);

   check(response, {
      [`package ${packageName} can upload`]: (r) => r.status === 200,
      [`package ${packageName} upload time < 500ms`]: (r) =>
         r.timings.duration < 500,
   });

   return apiPackage;
};

export const queryPackage = (packageId: string) => {
   const response = http.get(`${SIDECAR_URL}/packages`);

   check(response, {
      "package query successful": (r) => r.status === 200,
      "package query response time < 500ms": (r) => r.timings.duration < 500,
   });

   const packages = response.json() as Array<ApiPackage>;
   return packages.find((p) => p.id === packageId) ?? null;
};

export const unloadPackage = (packageName: SampleName, packageId: string) => {
   const response = http.del(`${SIDECAR_URL}/packages/${packageId}`);

   check(response, {
      [`package ${packageName} can unload`]: (r) => r.status === 204,
      [`package ${packageName} unload time < 500ms`]: (r) =>
         r.timings.duration < 500,
   });
};
