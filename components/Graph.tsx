import cytoscape from "cytoscape";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import CytoscapeComponent from "react-cytoscapejs";

interface GraphProps {
  elements: cytoscape.ElementDefinition[];
}

export default function Graph(props: GraphProps) {
  const router = useRouter();
  const [cytoscapeCore, setCytoscapeCore] = useState<cytoscape.Core>();

  useEffect(() => {
    cytoscapeCore?.on("click", "node", (e) => {
      router.push("/pages/" + e.target.id());
    });

    cytoscapeCore?.on("tap", "node", (e) => {
      router.push("/pages/" + e.target.id());
    });

    cytoscapeCore?.on("mouseover", "node", (e) => {
      document.body.style.cursor = "pointer";

      var sel = e.target;
      cytoscapeCore
        .elements()
        .difference(sel.outgoers().union(sel.incomers()))
        .not(sel)
        .addClass("semitransp");
      sel
        .addClass("highlight")
        .outgoers()
        .union(sel.incomers())
        .addClass("highlight");
    });

    cytoscapeCore?.on("mouseout", "node", (e) => {
      document.body.style.cursor = "default";
      var sel = e.target;
      cytoscapeCore.elements().removeClass("semitransp");
      sel
        .removeClass("highlight")
        .outgoers()
        .union(sel.incomers())
        .removeClass("highlight");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cytoscapeCore]);

  useEffect(() => {
    cytoscapeCore?.resize();
    cytoscapeCore
      ?.layout({
        name: "circle",
      })
      .run();

    cytoscapeCore?.fit(undefined, 50);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props]);

  return (
    <CytoscapeComponent
      elements={props.elements}
      cy={(cy) => {
        setCytoscapeCore(cy);
      }}
      style={{ height: "100%", position: "static" }}
      stylesheet={[
        {
          selector: "node",
          style: {
            width: 30,
            height: 30,
            backgroundColor: "rgb(4, 120, 87)",
            label: "data(label)",
            color: "white",
          },
        },
        {
          selector: "node:selected",
          style: {
            backgroundColor: "rgb(251, 191, 36)",
          },
        },
        {
          selector: "edge",
          style: {
            width: 5,
            "line-color": "rgb(82, 82, 82)",
          },
        },
        {
          selector: "node.highlight",
          style: {
            // backgroundColor: "rgb(251, 191, 36)",
          },
        },
        {
          selector: "node.semitransp",
          style: { opacity: 0.5 },
        },
        {
          selector: "edge.highlight",
          style: {
            "line-color": "white",
          },
        },
        {
          selector: "edge.semitransp",
          style: { opacity: 0.2 },
        },
      ]}
      layout={{
        name: "circle",
        animate: true,
        padding: 50,
        fit: true,
      }}
    />
  );
}
