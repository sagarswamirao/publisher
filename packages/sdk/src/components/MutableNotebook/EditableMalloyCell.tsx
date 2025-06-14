import { SourceAndPath, SourcesExplorer } from "../Model";
import { QueryExplorerResult } from "../Model/SourcesExplorer";
import { NotebookCellValue } from "../NotebookManager";

interface EditableMalloyCellProps {
   cell: NotebookCellValue;
   sourceAndPaths: SourceAndPath[];
   onChange: (query: QueryExplorerResult) => void;
}

export function EditableMalloyCell({
   cell,
   sourceAndPaths,
   onChange,
}: EditableMalloyCellProps) {
   const query = {
      query: cell.value,
      malloyResult: cell.result ? JSON.parse(cell.result) : undefined,
      malloyQuery: cell.queryInfo ? JSON.parse(cell.queryInfo) : undefined,
   };
   return (
      <SourcesExplorer
         sourceAndPaths={sourceAndPaths}
         existingQuery={query}
         existingSourceName={cell.sourceName}
         onChange={onChange}
      />
   );
}
