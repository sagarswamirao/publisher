import { AxiosError } from "axios";
import { RequestHandler } from "express";
import winston from "winston";

const isTelemetryEnabled = Boolean(process.env.OTEL_EXPORTER_OTLP_ENDPOINT);

export const logger = winston.createLogger({
   format: isTelemetryEnabled
      ? winston.format.combine(
           winston.format.uncolorize(),
           winston.format.timestamp(),
           winston.format.json(),
        )
      : winston.format.combine(
           winston.format.colorize(),
           winston.format.simple(),
        ),
   transports: [new winston.transports.Console()],
});

export const loggerMiddleware: RequestHandler = (req, res, next) => {
   const startTime = performance.now();
   res.on("finish", () => {
      const endTime = performance.now();
      logger.info(`${req.method} ${req.url}`, {
         statusCode: res.statusCode,
         duration: endTime - startTime,
      });
   });
   next();
};

export const logAxiosError = (error: AxiosError) => {
   if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      logger.error("Axios server-side error", {
         url: error.response.config.url,
         status: error.response.status,
         headers: error.response.headers,
         data: error.response.data,
      });
   } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      logger.error("Axios client-side error", { error: error.request });
   } else {
      // Something happened in setting up the request that triggered an Error
      logger.error("Axios unknown error", { error });
   }
};
