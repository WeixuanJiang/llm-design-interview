import { Controls, MarkerType, ReactFlow, ReactFlowProvider, useReactFlow, type Connection, type EdgeChange, type NodeChange } from "@xyflow/react";
import { Bot, Braces, Database, ListTree, Plus, Search, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { AWS_SERVICE_GROUPS, awsServiceLibrary, type AwsServiceGroup } from "../data/awsServiceLibrary";
import { enterpriseRagMission } from "../data/enterpriseRagMission";
import type { ArchitectureEdge, ArchitectureNode, AttemptState, ComponentCategory } from "../domain/types";
import { ConfirmDialog } from "./ConfirmDialog";
import { SystemNode } from "./SystemNode";
import "../builder.css";

interface ArchitectureBuilderProps {
  attempt: AttemptState;
  onNodesChange: (changes: NodeChange<ArchitectureNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<ArchitectureEdge>[]) => void;
  onConnect: (connection: Connection) => void;
  onAddNode: (node: ArchitectureNode) => void;
  onSelectNode: (id: string | null) => void;
  onRemoveNode: (id: string) => void;
  onEditDecision: () => void;
  components?: ArchitectureComponentSpec[];
}

export interface ArchitectureComponentSpec {
  id: string;
  label: string;
  service: string;
  category: ComponentCategory;
  group?: AwsServiceGroup;
  description: string;
}

const paletteIcons = { entry: Plus, compute: Braces, queue: ListTree, data: Database, ai: Bot };

// Blueprint skin: every edge ends in a closed arrow; the colour follows the theme token.
const defaultEdgeOptions = {
  markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: "var(--border-strong)" },
};

export function ArchitectureBuilder(props: ArchitectureBuilderProps) {
  return (
    <ReactFlowProvider>
      <ArchitectureBuilderCanvas {...props} />
    </ReactFlowProvider>
  );
}

function ArchitectureBuilderCanvas(props: ArchitectureBuilderProps) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteSeen, setPaletteSeen] = useState(false);
  const [componentQuery, setComponentQuery] = useState("");
  const [componentGroup, setComponentGroup] = useState<"All" | "Recommended" | AwsServiceGroup>("Recommended");
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();
  const nodeTypes = useMemo(() => ({ systemNode: SystemNode }), []);
  const selected = props.attempt.nodes.find((node) => node.id === props.attempt.selectedNodeId) ?? null;
  const canvasEmpty = props.attempt.nodes.length === 0;
  const onSelectionChange = useCallback(({ nodes }: { nodes: ArchitectureNode[] }) => props.onSelectNode(nodes[0]?.id ?? null), [props.onSelectNode]);

  // Rejected connections surface as a short-lived toast instead of a silent no-op.
  useEffect(() => {
    if (!connectError) return;
    const timer = window.setTimeout(() => setConnectError(null), 2800);
    return () => window.clearTimeout(timer);
  }, [connectError]);

  const recommendedComponents = props.components ?? enterpriseRagMission.components;
  const recommendedIds = useMemo(() => new Set(recommendedComponents.map(({ id }) => id)), [recommendedComponents]);
  const components = useMemo(() => {
    const unique = new Map<string, ArchitectureComponentSpec>();
    [...recommendedComponents, ...awsServiceLibrary].forEach((component) => unique.set(component.id, unique.get(component.id) ?? component));
    return [...unique.values()];
  }, [recommendedComponents]);
  const visibleComponents = useMemo(() => {
    const query = componentQuery.trim().toLowerCase();
    return components.filter((component) => {
      const matchesQuery = !query || `${component.label} ${component.service} ${component.description}`.toLowerCase().includes(query);
      const matchesGroup = componentGroup === "All"
        || (componentGroup === "Recommended" && recommendedIds.has(component.id))
        || component.group === componentGroup;
      return matchesQuery && matchesGroup;
    });
  }, [componentGroup, componentQuery, components, recommendedIds]);
  const visibleGroups = useMemo(() => {
    if (componentGroup === "Recommended") return [{ name: "Recommended for this case", components: visibleComponents }];
    const groups = AWS_SERVICE_GROUPS.map((group) => ({ group, name: group, components: visibleComponents.filter((component) => component.group === group) }));
    const uncategorized = visibleComponents.filter((component) => !component.group);
    return [...(uncategorized.length ? [{ name: "Mission components", components: uncategorized }] : []), ...groups].filter((group) => group.components.length);
  }, [componentGroup, visibleComponents]);

  // Guard rails: no self-loops, and no duplicate edges in either direction.
  const handleConnect = (connection: Connection) => {
    if (!connection.source || !connection.target) return;
    if (connection.source === connection.target) {
      setConnectError("A component cannot connect to itself. Choose two different components.");
      return;
    }
    const duplicate = props.attempt.edges.some((edge) =>
      (edge.source === connection.source && edge.target === connection.target)
      || (edge.source === connection.target && edge.target === connection.source));
    if (duplicate) {
      setConnectError("These two components are already connected.");
      return;
    }
    props.onConnect(connection);
  };

  // Click-to-add lands near the viewport centre with a stagger, so nodes never stack exactly.
  const nextClickPosition = () => {
    const rect = canvasRef.current?.getBoundingClientRect();
    const index = props.attempt.nodes.length;
    if (rect && rect.width > 0) {
      const center = screenToFlowPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      const step = index % 5;
      return { x: center.x - 100 + step * 48, y: center.y - 56 + step * 40 };
    }
    return { x: 120 + (index % 4) * 220, y: 120 + Math.floor(index / 4) * 190 };
  };

  const addComponent = (component: ArchitectureComponentSpec, position?: { x: number; y: number }) => {
    const instance = props.attempt.nodes.filter((node) => node.id.startsWith(component.id)).length;
    const id = instance === 0 ? component.id : `${component.id}-${instance + 1}`;
    props.onAddNode({
      id,
      type: "systemNode",
      position: position ?? nextClickPosition(),
      data: { label: component.label, service: component.service, category: component.category as ComponentCategory, description: component.description },
    });
    setPaletteOpen(false);
  };

  // screenToFlowPosition keeps the drop point under the cursor at any zoom level.
  const dropComponent = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const component = components.find((item) => item.id === event.dataTransfer.getData("application/aws-component"));
    if (!component) return;
    const point = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    addComponent(component, { x: point.x - 96, y: point.y - 28 });
  };

  const togglePalette = () => {
    setPaletteOpen((open) => !open);
    setPaletteSeen(true);
  };
  // First-open coachmark: pulse the library button until the learner opens it once.
  const showLibraryPulse = canvasEmpty && !paletteOpen && !paletteSeen;

  return (
    <div className="builder-shell">
      <div className="builder-toolbar">
        <button className={showLibraryPulse ? "button secondary builder-pulse" : "button secondary"} onClick={togglePalette} aria-expanded={paletteOpen} aria-controls="component-palette"><Plus /> Components{showLibraryPulse ? <span className="builder-coachmark" aria-hidden="true">Start here — add AWS services</span> : null}</button>
        <span className="toolbar-note">Connect nodes by dragging between their handles. Select a node to record its decision.</span>
      </div>
      <div className="builder-body">
        {paletteOpen ? <aside className="component-palette" id="component-palette" aria-label="AWS component library">
          <header><div><h3>AWS component library</h3><p>Drag a service onto the canvas or click to add it.</p></div><button className="icon-button" onClick={() => setPaletteOpen(false)} aria-label="Close AWS component library" title="Close component library"><X /></button></header>
          <label className="component-search"><Search /><input value={componentQuery} onChange={(event) => setComponentQuery(event.target.value)} aria-label="Search AWS services" placeholder="Search AWS services" /></label>
          <label className="component-filter"><span>Category</span><select value={componentGroup} onChange={(event) => setComponentGroup(event.target.value as typeof componentGroup)} aria-label="AWS service category"><option value="Recommended">Recommended</option><option value="All">All services</option>{AWS_SERVICE_GROUPS.map((group) => <option key={group} value={group}>{group}</option>)}</select></label>
          <div className="component-count"><strong>{visibleComponents.length}</strong> of {components.length} services</div>
          <div className="component-list">{visibleGroups.map((group) => <section key={group.name}><h4>{group.name}</h4>{group.components.map((component) => { const Icon = paletteIcons[component.category]; return <button key={component.id} draggable onDragStart={(event) => { event.dataTransfer.setData("application/aws-component", component.id); event.dataTransfer.effectAllowed = "copy"; }} onClick={() => addComponent(component)}><span className={`node-icon ${component.category}`}><Icon /></span><span><span className="component-name"><strong>{component.label}</strong>{recommendedIds.has(component.id) && componentGroup !== "Recommended" ? <small>Recommended</small> : null}</span><small>{component.description}</small></span></button>; })}</section>)}</div>
          {!visibleComponents.length ? <p className="component-empty">No AWS services match this search.</p> : null}
        </aside> : null}
        <div className="flow-canvas blueprint-canvas" ref={canvasRef} aria-label="Architecture canvas" onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; }} onDrop={dropComponent}>
          <ReactFlow
            nodes={props.attempt.nodes}
            edges={props.attempt.edges}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            onNodesChange={props.onNodesChange}
            onEdgesChange={props.onEdgesChange}
            onConnect={handleConnect}
            onSelectionChange={onSelectionChange}
            fitView
            minZoom={0.55}
            maxZoom={1.4}
            deleteKeyCode={null}
          >
            <Controls showInteractive={false} />
          </ReactFlow>
          {canvasEmpty && !paletteOpen ? <div className="builder-empty" role="note" aria-label="How to build your architecture">
            <div className="builder-empty-card">
              <span className="eyebrow-label">Empty canvas</span>
              <ol className="builder-empty-steps">
                <li><span className="builder-empty-step" aria-hidden="true">1</span><div><strong>Add AWS services</strong><p>Drag a service from the component library onto the canvas, or click it to place it.</p></div></li>
                <li><span className="builder-empty-step" aria-hidden="true">2</span><div><strong>Connect the flow</strong><p>Drag from one node's handle to another to draw request and data paths.</p></div></li>
                <li><span className="builder-empty-step" aria-hidden="true">3</span><div><strong>Record decisions</strong><p>Select a node to capture its requirement, trade-off, and revisit condition.</p></div></li>
              </ol>
            </div>
          </div> : null}
          {connectError ? <div className="builder-toast" role="alert">{connectError}</div> : null}
          <div className="mobile-node-list" aria-label="Architecture components">
            {props.attempt.nodes.map((node) => <button key={node.id} className={node.id === props.attempt.selectedNodeId ? "mobile-node selected" : "mobile-node"} onClick={() => props.onSelectNode(node.id)}><span className={`node-icon ${node.data.category}`}>{node.data.label.slice(0,2).toUpperCase()}</span><span><strong>{node.data.label}</strong><small>{node.data.description}</small></span></button>)}
          </div>
        </div>
      </div>
      <footer className="node-inspector">
        {selected ? <><div><span className="inspector-label">Selected component</span><strong>{selected.data.label}</strong><p title={props.attempt.decisions[selected.id] || undefined}>{props.attempt.decisions[selected.id] || "No decision recorded. Explain the requirement, trade-off, and revisit condition."}</p></div><div className="inspector-actions"><button className="button secondary" onClick={props.onEditDecision}>Edit reasoning</button><button className="icon-button danger" onClick={() => setConfirmRemoveId(selected.id)} aria-label={`Remove ${selected.data.label}`} title={`Remove ${selected.data.label}`}><Trash2 /></button></div></> : <p>Select a component to inspect its decision.</p>}
      </footer>

      <ConfirmDialog
        open={confirmRemoveId !== null}
        title="Remove component?"
        body={confirmRemoveId ? `Remove ${props.attempt.nodes.find((node) => node.id === confirmRemoveId)?.data.label ?? "this component"}? Its recorded decision and connections will be deleted.` : ""}
        confirmLabel="Remove"
        tone="danger"
        onConfirm={() => { if (confirmRemoveId) props.onRemoveNode(confirmRemoveId); setConfirmRemoveId(null); }}
        onCancel={() => setConfirmRemoveId(null)}
      />
    </div>
  );
}
