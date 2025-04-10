import fs, { mkdirSync } from "fs";
import archiver from "archiver";
import path from "path";

async function createTmpPackageArchive(
   packageName: string,
   packagePath: string,
) {
   if (!fs.existsSync(path.join(__dirname, "packages"))) {
      mkdirSync(path.join(__dirname, "packages"), { recursive: true });
   }
   const outputPath = path.join(__dirname, "packages", `${packageName}.zip`);
   if (fs.existsSync(outputPath)) {
      return;
   }
   const output = fs.createWriteStream(outputPath);
   const archive = archiver("zip", {
      zlib: { level: 9 },
   });

   const promise = new Promise<void>((resolve, reject) => {
      archive
         .on("warning", function (err) {
            console.warn(err);
            reject(err);
         })
         .on("error", function (err) {
            console.error(err);
            reject(err);
         })
         .directory(
            path.join(__dirname, "..", "malloy-samples", packagePath),
            false,
         )
         .pipe(output);

      output.on("close", function () {
         resolve();
      });
      archive.finalize();
   });
   return promise;
}

const samples = [
   ["auto_recalls", "auto_recalls"],
   ["ecommerce", "ecommerce"],
   ["faa", "faa"],
   ["ga4", "ga4"],
   ["imdb", "imdb"],
   ["names", "names"],
   ["patterns", "patterns"],
   ["bq_ga4", "bigquery/ga4"],
   ["bq_ga_sessions", "bigquery/ga_sessions"],
   ["bq_hackernews", "bigquery/hackernews"],
   ["bq_the_met", "bigquery/the_met"],
];
for (const [sampleName, samplePath] of samples) {
   await createTmpPackageArchive(sampleName, samplePath);
}
