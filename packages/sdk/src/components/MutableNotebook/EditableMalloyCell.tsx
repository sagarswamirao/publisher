import { SourceAndPath, SourcesExplorer } from "../Model";
import { NotebookCellValue } from "../NotebookManager";

interface EditableMalloyCellProps {
   cell: NotebookCellValue;
   sourceAndPaths: SourceAndPath[];
   onCellChange: (cell: NotebookCellValue) => void;

   onClose: () => void;
}

export function EditableMalloyCell({
   cell,
   sourceAndPaths,
   onCellChange,
   onClose,
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
         saveResult={(modelPath, sourceName, qer) => {
            // Convert the results of the Query Explorer into
            // the stringified JSON objects that are stored in the cell.
            onCellChange({
               ...cell,
               value: qer.query,
               result: qer.malloyResult
                  ? JSON.stringify(qer.malloyResult)
                  : undefined,
               queryInfo: qer.malloyQuery
                  ? JSON.stringify(qer.malloyQuery)
                  : undefined,
               sourceName,
               modelPath,
            });
            onClose();
         }}
      />
   );
}
