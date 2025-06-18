import { Home } from "@malloy-publisher/sdk";
import { useRouterClickHandler } from "@malloy-publisher/sdk";

export function HomePage() {
   const navigate = useRouterClickHandler();
   return <Home navigate={navigate} />;
}
