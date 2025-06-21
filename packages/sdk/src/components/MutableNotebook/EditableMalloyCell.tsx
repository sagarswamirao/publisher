import { SourceAndPath, SourcesExplorer } from "../Model";
import { QueryExplorerResult } from "../Model/SourcesExplorer";
import { NotebookCellValue } from "../NotebookManager";

interface EditableMalloyCellProps {
   cell: NotebookCellValue;
   sourceAndPaths: SourceAndPath[];
   onQueryChange: (query: QueryExplorerResult) => void;
   onSourceChange?: (index: number) => void;
}

export function EditableMalloyCell({
   cell,
   sourceAndPaths,
   onQueryChange,
   onSourceChange,
}: EditableMalloyCellProps) {
   const query = {
      query: cell.value,
      malloyResult: cell.result ? JSON.parse(cell.result) : undefined,
      malloyQuery: cell.queryInfo ? JSON.parse(cell.queryInfo) : undefined,
      sourceName: cell.sourceName,
      modelPath: cell.modelPath,
   };
   return (
      <SourcesExplorer
         sourceAndPaths={sourceAndPaths}
         existingQuery={query}
         existingSourceName={cell.sourceName}
         onQueryChange={onQueryChange}
         onSourceChange={onSourceChange}
      />
   );
}
