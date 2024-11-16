import * as React from "react";
import {
   TreeItem2Content,
   TreeItem2Label,
   TreeItem2Root,
   TreeItem2IconContainer,
} from "@mui/x-tree-view/TreeItem2";
import { RichTreeView } from "@mui/x-tree-view/RichTreeView";
import { TreeItem2Provider } from "@mui/x-tree-view/TreeItem2Provider";
import { TreeViewBaseItem } from "@mui/x-tree-view/models";
import {
   unstable_useTreeItem2 as useTreeItem2,
   UseTreeItem2Parameters,
} from "@mui/x-tree-view/useTreeItem2";
import { TreeItem2Icon } from "@mui/x-tree-view/TreeItem2Icon";
import FolderIcon from "@mui/icons-material/FolderOutlined";
import ArticleIcon from "@mui/icons-material/ArticleOutlined";
import ErrorIcon from "@mui/icons-material/ErrorOutlined";
import { TransitionProps } from "@mui/material/transitions";
import { animated, useSpring } from "@react-spring/web";
import Collapse from "@mui/material/Collapse";
import DnsIcon from "@mui/icons-material/DnsOutlined";
import DataArrayIcon from "@mui/icons-material/DataArrayOutlined";
import { Database, Model } from "../../client";
import { Typography } from "@mui/material";

interface FiieTreeViewProps {
   items: Model[] | Database[];
   defaultExpandedItems: string[];
   navigate?: (to: string) => void;
}

export function FileTreeView({
   items,
   defaultExpandedItems,
   navigate,
}: FiieTreeViewProps) {
   return (
      <RichTreeView
         items={getTreeView(items, navigate)}
         defaultExpandedItems={defaultExpandedItems}
         slots={{ item: CustomTreeItem }}
      />
   );
}

const AnimatedCollapse = animated(Collapse);

function TransitionComponent(props: TransitionProps) {
   const style = useSpring({
      to: {
         opacity: props.in ? 1 : 0,
         transform: `translate3d(0,${props.in ? 0 : 20}px,0)`,
      },
   });

   return <AnimatedCollapse style={style} {...props} />;
}

type FileType = "directory" | "model" | "notebook" | "database" | "unknown";

type ExtendedTreeItemProps = {
   id: string;
   label: string;
   fileType: FileType;
   selectable: boolean;
   link: () => void | undefined;
};

interface CustomLabelProps {
   item: ExtendedTreeItemProps;
}

function CustomTreeItem2Label({ item, ...other }: CustomLabelProps) {
   return (
      <TreeItem2Label
         {...other}
         sx={{
            display: "flex",
            alignItems: "center",
            color: "grey.600",
         }}
      >
         {(item.fileType === "directory" && <FolderIcon />) ||
            (item.fileType === "notebook" && <ArticleIcon />) ||
            (item.fileType === "model" && <DataArrayIcon />) ||
            (item.fileType == "database" && <DnsIcon />) || <ErrorIcon />}
         <Typography
            variant="body2"
            sx={{ marginLeft: "5px" }}
            color={item.link ? "primary.main" : "grey.600"}
         >
            {item.label}
         </Typography>
      </TreeItem2Label>
   );
}

interface CustomTreeItemProps
   extends Omit<UseTreeItem2Parameters, "rootRef">,
      Omit<React.HTMLAttributes<HTMLLIElement>, "onFocus"> {}

const CustomTreeItem = React.forwardRef(function CustomTreeItem(
   props: CustomTreeItemProps,
   ref: React.Ref<HTMLLIElement>,
) {
   const { id, itemId, label, children, disabled, ...other } = props;
   const {
      getRootProps,
      getContentProps,
      getLabelProps,
      getIconContainerProps,
      getGroupTransitionProps,
      status,
      publicAPI,
   } = useTreeItem2({
      id,
      itemId,
      children,
      label,
      disabled,
      rootRef: ref,
   });

   const item = publicAPI.getItem(itemId);

   // Disable select and focus. We want to either click through to a model or notebook or just exapnd
   // collapse
   status.selected = false;
   status.focused = false;

   return (
      <TreeItem2Provider itemId={itemId}>
         <TreeItem2Root {...getRootProps(other)}>
            <TreeItem2Content
               {...getContentProps()}
               {...(item.link && {
                  onClick: () => item.link(),
               })}
               sx={{
                  // If the item is not selectable, disable pointer events.
                  pointerEvents: !item.selectable && "none",
               }}
            >
               <TreeItem2IconContainer {...getIconContainerProps()}>
                  <TreeItem2Icon status={status} />
               </TreeItem2IconContainer>
               <CustomTreeItem2Label
                  {...getLabelProps({
                     item,
                  })}
               />
            </TreeItem2Content>
            {children && <TransitionComponent {...getGroupTransitionProps()} />}
         </TreeItem2Root>
      </TreeItem2Provider>
   );
});

function getTreeView(
   metadataEntries: Model[] | Database[],
   navigate: (to: string) => void,
): TreeViewBaseItem<ExtendedTreeItemProps>[] {
   const tree = new Map<string, unknown>();
   metadataEntries.map((entry: Model | Database) => {
      let node = tree;
      const pathParts = entry.path.split("/");
      pathParts.forEach((part, index) => {
         if (index === pathParts.length - 1) {
            node.set(part, entry);
         } else if (!node.has(part)) {
            node.set(part, new Map<string, unknown>());
            node = node.get(part) as Map<string, unknown>;
         } else {
            node = node.get(part) as Map<string, unknown>;
         }
      });
   });
   return getTreeViewRecursive(tree, "", navigate);
}

function getTreeViewRecursive(
   node: Map<string, unknown>,
   path: string,
   navigate: (to: string) => void,
): TreeViewBaseItem<ExtendedTreeItemProps>[] {
   const treeViewItems: TreeViewBaseItem<ExtendedTreeItemProps>[] = [];
   node.forEach((value, key) => {
      if ((value as Model | Database).type !== undefined) {
         const fileType =
            (key.endsWith(".malloy") && "model") ||
            (key.endsWith(".malloynb") && "notebook") ||
            (key.endsWith(".parquet") && "database") ||
            "unknown";
         // This is a model or database.
         treeViewItems.push({
            id: path + key,
            label: key,
            fileType: fileType,
            link:
               fileType === "model" || fileType === "notebook"
                  ? navigate.bind(null, path + key)
                  : undefined,
            selectable: fileType === "model" || fileType === "notebook",
         });
      } else {
         // This is a directory.
         path += `${key}/`;
         treeViewItems.push({
            id: path,
            label: key,
            fileType: "directory",
            selectable: true,
            link: undefined,
            children: getTreeViewRecursive(
               value as Map<string, unknown>,
               path,
               navigate,
            ),
         });
      }
   });
   return treeViewItems;
}
