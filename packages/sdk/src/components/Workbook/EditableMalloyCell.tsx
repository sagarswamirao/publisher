import { SourceAndPath, SourcesExplorer } from "../Model";
import { QueryExplorerResult } from "../Model/SourcesExplorer";
import { WorkbookCellValue } from "./WorkbookManager";

interface EditableMalloyCellProps {
   cell: WorkbookCellValue;
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
   };

   // Find the selected source index based on the cell's source name
   const selectedSourceIndex = sourceAndPaths.findIndex(
      (sourceAndPath) => sourceAndPath.sourceInfo.name === cell.sourceName,
   );

   return (
      <SourcesExplorer
         sourceAndPaths={sourceAndPaths}
         selectedSourceIndex={
            selectedSourceIndex >= 0 ? selectedSourceIndex : 0
         }
         existingQuery={query}
         onQueryChange={onQueryChange}
         onSourceChange={onSourceChange}
      />
   );
}
