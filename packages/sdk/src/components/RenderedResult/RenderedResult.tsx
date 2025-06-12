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
   height?: number;
   isFillElement?: (boolean) => void;
   onSizeChange?: (height: number) => void;
   onDrill?: (element: any) => void;
}

// RendererResult does some magic to make it work for both fill and non-fill elements.
// Generally text results and complicated results are non-fill. That is, they have a natural, fixed height.
// Simple charts are fill. That is, they scale to fill the available space.
// We only know what kind of element we're dealing with after the viz is rendered.
// So we use a callback to notify the parent that we're in a fill element.
// The parent can then set the height for the element, otherwise it will have size 0.
export default function RenderedResult({
   result,
   height,
   isFillElement,
   onSizeChange,
   onDrill,
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
      if (!ref.current) return;
      const element = ref.current;

      // Function to measure and report size
      const measureSize = () => {
         if (element) {
            const measuredHeight = element.offsetHeight;
            if (measuredHeight > 0) {
               onSizeChange && onSizeChange(measuredHeight);
            } else if (isFillElement && element.firstChild) {
               // HACK- we If there's a child and it's height is 0, then we're in a fill element
               // We use the callback `isFillElement` to notify the parent that we're in a fill element
               // the parent should then set height for this element, otherwise it will have size 0.
               const child = element.firstChild as HTMLElement;
               const childHeight = child.offsetHeight;
               if (childHeight == 0) {
                  isFillElement(true);
               } else {
                  isFillElement(false);
               }
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
      onClick: onDrill,
   });
   return (
      <div
         ref={ref}
         style={{
            width: "100%",
            height: height ? `${height}px` : "100%",
         }}
      />
   );
}
