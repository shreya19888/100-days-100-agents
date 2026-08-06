"use client";

import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  Node,
  Edge,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

type Props = {
  upstream: string[];
  dataset: string;
  downstream: string[];
};

export default function LineageGraph({
  upstream,
  dataset,
  downstream,
}: Props) {
  const nodes: Node[] = [];

  const edges: Edge[] = [];

  upstream.forEach((name, index) => {
    nodes.push({
      id: name,
      position: {
        x: 100,
        y: index * 100,
      },
      data: {
        label: name,
      },
      type: "default",
    });

    edges.push({
      id: `${name}-${dataset}`,
      source: name,
      target: dataset,
    });
  });

  nodes.push({
    id: dataset,
    position: {
      x: 450,
      y: 150,
    },
    data: {
      label: dataset,
    },
    style: {
      background: "#2563eb",
      color: "white",
      borderRadius: 12,
      padding: 10,
      fontWeight: "bold",
    },
  });

  downstream.forEach((name, index) => {
    nodes.push({
      id: name,
      position: {
        x: 800,
        y: index * 100,
      },
      data: {
        label: name,
      },
    });

    edges.push({
      id: `${dataset}-${name}`,
      source: dataset,
      target: name,
    });
  });

  return (
    <div className="h-[600px] rounded-2xl overflow-hidden border bg-white">
      <ReactFlow
        fitView
        nodes={nodes}
        edges={edges}
      >
        <MiniMap />
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
}