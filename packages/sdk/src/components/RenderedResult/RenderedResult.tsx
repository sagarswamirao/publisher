/* eslint-disable react/prop-types */
import type { MalloyRenderProps } from "@malloydata/render";
import { MalloyRenderer } from "@malloydata/render";
import React, { useEffect, useRef } from "react";

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
   onSizeChange?: (height: number) => void;
}

export default function RenderedResult({
   result,
   onSizeChange,
}: RenderedResultProps) {
   const ref = useRef<HTMLDivElement>(null);

   useEffect(() => {
      if (ref.current) {
         const viz = renderer.createViz();
         // Remove all content from ref.current before rendering new viz
         while (ref.current.firstChild) {
            ref.current.removeChild(ref.current.firstChild);
         }
         viz.setResult(JSON.parse(result));
         viz.render(ref.current);
      }
   }, [result, ref]);

   // Set up size measurement using scrollHeight instead of ResizeObserver
   useEffect(() => {
      if (!ref.current || !onSizeChange) return;

      const element = ref.current;

      // Function to measure and report size
      const measureSize = () => {
         if (element) {
            const height = element.offsetHeight;
            if (height > 0) {
               onSizeChange(height);
            }
         }
      };

      // Initial measurement after a brief delay to let content render
      const timeoutId = setTimeout(measureSize, 100);

      // Also measure when the malloy result changes
      const observer = new MutationObserver(measureSize);
      observer.observe(element, {
         childList: true,
         subtree: true,
         attributes: true,
      });

      // Cleanup
      return () => {
         clearTimeout(timeoutId);
         observer.disconnect();
      };
   }, [onSizeChange, result]);

   const renderer = new MalloyRenderer({
      onClick: (payload) => console.log("Click:", payload),
      // other options...
   });

   return <div ref={ref} />;
}
