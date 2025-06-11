import { Home } from "@malloy-publisher/sdk";
import { useRouterClickHandler } from "@malloy-publisher/sdk";
interface HomePageProps {
   server?: string;
}

export function HomePage({ server }: HomePageProps) {
   const navigate = useRouterClickHandler();
   return <Home server={server} navigate={navigate} />;
}
