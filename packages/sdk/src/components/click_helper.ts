import { useNavigate } from "react-router-dom";
import { MouseEvent } from "react";

/**
 * Custom hook that returns a function for handling clicks with proper modifier key support.
 * The returned function handles CMD/Ctrl clicks to open in new tabs, regular clicks for navigation.
 *
 * @returns A function that takes a relative URL and either navigates or opens in new tab
 */
export function useRouterClickHandler() {
   const navigate = useNavigate();

   return (to: string, event?: MouseEvent) => {
      // If no event or no modifier keys, use normal navigation
      if (
         !event ||
         (!event.metaKey &&
            !event.ctrlKey &&
            !event.shiftKey &&
            event.button !== 1)
      ) {
         navigate(to);
         return;
      }

      // For modifier keys or middle mouse, let browser handle it by opening URL
      const href = window.location.origin + to;

      if (event.metaKey || event.ctrlKey || event.button === 1) {
         // CMD/Ctrl click or middle mouse - open in new tab
         window.open(href, "_blank");
      } else if (event.shiftKey) {
         // Shift click - open in new window
         window.open(href, "_blank");
      }
   };
}
