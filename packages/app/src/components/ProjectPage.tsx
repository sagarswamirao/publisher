import { useNavigate } from "react-router-dom";
import { Project } from "@malloy-publisher/sdk";

interface ProjectPageProps {
   server?: string;
}

export function ProjectPage({ server }: ProjectPageProps) {
   const navigate = useNavigate();
   return <Project server={server} navigate={navigate} />;
}
