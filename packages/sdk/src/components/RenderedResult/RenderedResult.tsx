/* eslint-disable react/prop-types */
import React, { useEffect, useRef } from "react";
import type { MalloyRenderProps } from "@malloydata/render";
import "@malloydata/render/webcomponent";

type MalloyRenderElement = HTMLElement & MalloyRenderProps;

declare global {
   // eslint-disable-next-line @typescript-eslint/no-namespace
   namespace JSX {
      interface IntrinsicElements {
         "malloy-render": React.DetailedHTMLProps<
            React.HTMLAttributes<HTMLElement>,
            MalloyRenderElement
         >;
      }
   }
}

interface RenderedResultProps {
   result: string;
}

export default function RenderedResult({ result }: RenderedResultProps) {
   const ref = useRef<MalloyRenderElement>(null);
   useEffect(() => {
      if (ref.current) {
         ref.current.malloyResult = JSON.parse(result);
      }
   }, [result]);
   return <malloy-render ref={ref} />;
}
