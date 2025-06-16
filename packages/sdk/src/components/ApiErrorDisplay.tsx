import { Typography } from "@mui/material";
import React from "react";

export interface ApiError extends Error {
   status?: number;
   data?: {
      code: number;
      message: string;
   };
}

interface ApiErrorDisplayProps {
   error: ApiError;
   context?: string;
}

export function ApiErrorDisplay({ error, context }: ApiErrorDisplayProps) {
   return (
      <>
         {context && (
            <Typography variant="body2" sx={{ p: "10px", m: "auto" }}>
               {context}
            </Typography>
         )}
         {error.data && (
            <pre
               style={{
                  whiteSpace: "pre-wrap",
                  color: "red",
                  backgroundColor: "black",
                  padding: "10px",
                  margin: "auto",
               }}
            >
               {error.data.message}
            </pre>
         )}
      </>
   );
}
