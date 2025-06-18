import { Home, useServer } from "@malloy-publisher/sdk";
import { useRouterClickHandler } from "@malloy-publisher/sdk";

export function HomePage() {
   const navigate = useRouterClickHandler();
   const { accessToken, server } = useServer();
   return (
      <Home server={server} accessToken={accessToken} navigate={navigate} />
   );
}
