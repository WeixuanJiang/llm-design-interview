import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Bot, Braces, Database, Globe2, ListTree } from "lucide-react";
import type { ArchitectureNode } from "../domain/types";

const icons = { entry: Globe2, compute: Braces, queue: ListTree, data: Database, ai: Bot };

export function SystemNode({ data, selected }: NodeProps<ArchitectureNode>) {
  const Icon = icons[data.category];
  return (
    <article className={`system-node ${selected ? "selected" : ""} ${data.warning ? "warning" : ""}`} aria-label={`${data.label} architecture component`}>
      <Handle type="target" position={Position.Left} />
      <div className="node-heading"><span className={`node-icon ${data.category}`}><Icon /></span><strong>{data.label}</strong></div>
      <p>{data.description}</p>
      {data.metric ? <span className="node-metric">{data.metric}</span> : null}
      {data.warning ? <span className="node-warning">{data.warning}</span> : null}
      <Handle type="source" position={Position.Right} />
    </article>
  );
}
