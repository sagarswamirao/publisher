/* eslint-disable react/prop-types */
import type { MalloyRenderProps } from "@malloydata/render";
import { MalloyRenderer } from "@malloydata/render";
import React, { useEffect, useRef, useState, useLayoutEffect } from "react";

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
//
// In order to make this work when contained in a "Suspend" component, we need to
// make sure that the rendering process is started after the DOM element is available.
// We do this by using a useLayoutEffect to start the rendering process.
// We also need to make sure that the rendering process is started before the
// Suspense component is rendered.
// We do this by using a useEffect to start the rendering process.
export default function RenderedResult({
   result,
   height,
   isFillElement,
   onSizeChange,
   onDrill,
}: RenderedResultProps) {
   const ref = useRef<HTMLDivElement>(null);
   const [isRendered, setIsRendered] = useState(false);
   const [renderingStarted, setRenderingStarted] = useState(false);
   const [wasMeasured, setWasMeasured] = useState(false);
   // Each component instance manages its own promise and resolver
   const renderingPromiseRef = useRef<Promise<void> | null>(null);
   const renderingResolverRef = useRef<(() => void) | null>(null);

   // Start rendering process after DOM element is available
   useLayoutEffect(() => {
      if (ref.current && result && !renderingStarted) {
         setRenderingStarted(true);

         // Create the promise now that we're ready to start rendering
         if (!renderingPromiseRef.current) {
            renderingPromiseRef.current = new Promise<void>((resolve) => {
               renderingResolverRef.current = resolve;
            });
         }

         const renderer = new MalloyRenderer({
            onClick: onDrill,
         });
         const viz = renderer.createViz();

         // Remove all content from ref.current before rendering new viz
         while (ref.current.firstChild) {
            ref.current.removeChild(ref.current.firstChild);
         }

         // Set up a mutation observer to detect when content is added
         const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
               if (
                  mutation.type === "childList" &&
                  mutation.addedNodes.length > 0
               ) {
                  // Check if actual content (not just empty elements) was added
                  const hasContent = Array.from(mutation.addedNodes).some(
                     (node) => {
                        return node.nodeType === Node.ELEMENT_NODE;
                     },
                  );
                  if (hasContent) {
                     // Content detected, mark as rendered
                     observer.disconnect();
                     setTimeout(() => {
                        setIsRendered(true);
                        if (renderingResolverRef.current) {
                           renderingResolverRef.current();
                           renderingResolverRef.current = null;
                           renderingPromiseRef.current = null;
                        }
                     }, 50); // Small delay to ensure content is fully rendered
                     break;
                  }
               }
            }
         });

         if (ref.current) {
            observer.observe(ref.current, {
               childList: true,
               subtree: true,
               characterData: true,
            });

            try {
               viz.setResult(JSON.parse(result));
               viz.render(ref.current);
            } catch (error) {
               console.error("Error rendering visualization:", error);
               observer.disconnect();
               setIsRendered(true);
               if (renderingResolverRef.current) {
                  renderingResolverRef.current();
                  renderingResolverRef.current = null;
                  renderingPromiseRef.current = null;
               }
            }
         }
      }
   }, [result, onDrill, renderingStarted]);

   // Reset rendering state when result changes
   useEffect(() => {
      setIsRendered(false);
      setRenderingStarted(false);
      renderingPromiseRef.current = null;
      renderingResolverRef.current = null;
   }, [result]);

   // If rendering has started but not completed, throw the promise to trigger Suspense
   if (renderingStarted && !isRendered && renderingPromiseRef.current) {
      throw renderingPromiseRef.current;
   }
   // Set up size measurement using scrollHeight instead of ResizeObserver
   useEffect(() => {
      if (!ref.current || !isRendered) return;
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

      let observer: MutationObserver | null = null;
      // Also measure when the malloy result changes
      if (!wasMeasured) {
         observer = new MutationObserver(measureSize);
         observer.observe(element, {
            childList: true,
            subtree: true,
            attributes: true,
         });
      }

      // Cleanup
      return () => {
         clearTimeout(timeoutId);
         observer?.disconnect();
      };
   }, [onSizeChange, result, isFillElement, isRendered]);

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
