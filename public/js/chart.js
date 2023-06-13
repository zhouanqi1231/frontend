export const forceGraph = (
  {
    nodes, // [{id}, …]
    links, // [{source, target}, …]
  },
  {
    infoPanel, // infoPanel, used when elements clicked
    svgId = "force-graph",
    nodeId = (d) => d.node_id,
    nodeGroup = (d) => d.label,
    nodeStroke = "white",
    nodeStrokeWidth = 1.5,
    nodeStrokeOpacity = 1,
    nodeRadius = (d) => d.value,
    nodeStrength = -18,
    linkId = (d) => d.relationship_id,
    linkSource = ({ source }) => source,
    linkTarget = ({ target }) => target,
    linkStroke = "#999",
    linkStrokeOpacity = 0.3,
    linkStrokeWidth = 2,
    linkStrokeLinecap = "round", // means "(-------)"
    colors = [
      "#2b851c",
      "#61b628",
      "#7abd7a",
      "#4ead81",
      "#8ed542",
      "#49ceff",
      "#ffe35e",
      "#56ffa9",
      "#ff55b6",
      "#abe758",
    ],
    width, // w&h for the graph
    height,
  } = {}
) => {
  // 映射关系
  const NODE_ID = d3.map(nodes, nodeId);
  const NODE_RADIUS = d3.map(nodes, nodeRadius);
  const NODE_GROUP = d3.map(nodes, nodeGroup);
  const color = d3.scaleOrdinal(d3.sort(NODE_GROUP), colors); // label -> color

  const LINK_ID = d3.map(links, linkId);
  const LINK_SOURCE = d3.map(links, linkSource);
  const LINK_TARGET = d3.map(links, linkTarget);

  nodes = d3.map(nodes, (_, i) => ({
    id: NODE_ID[i],
  }));
  links = d3.map(links, (_, i) => ({
    source: LINK_SOURCE[i],
    target: LINK_TARGET[i],
    id: LINK_ID[i],
  }));

  const forceNode = d3.forceManyBody().strength(nodeStrength);
  const forceLink = d3.forceLink(links).id(({ index: i }) => NODE_ID[i]);

  const svg = d3
    .create("svg")
    .attr("id", svgId)
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [-width / 2, -height / 2, width, height])
    .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

  const link = svg
    .append("g")
    .attr("stroke", linkStroke)
    .attr("stroke-opacity", linkStrokeOpacity)
    .attr("stroke-width", linkStrokeWidth)
    .attr("stroke-linecap", linkStrokeLinecap)
    .selectAll("line")
    .data(links)
    .join("line")
    .attr("id", (d) => "link-" + d.id) // so can be easily found later
    .on("click", linkClicked);

  const node = svg
    .append("g")
    .attr("stroke", nodeStroke)
    .attr("stroke-opacity", nodeStrokeOpacity)
    .attr("stroke-width", nodeStrokeWidth)
    .selectAll("circle")
    .data(nodes)
    .join("circle")
    .attr("id", (d) => "node-" + d.id) // so can be easily found later
    .on("click", nodeClicked);

  const simulation = d3
    .forceSimulation(nodes)
    .force("link", forceLink)
    .force("charge", forceNode)
    .force("center", d3.forceCenter())
    .on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);
      node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
    });

  // why after simulation?
  node.attr("fill", ({ index: i }) => color(NODE_GROUP[i]));
  node.attr("original-fill", ({ index: i }) => color(NODE_GROUP[i]));
  node.attr("r", ({ index: i }) => Math.log(NODE_RADIUS[i]) + 3);
  node.attr("original-r", ({ index: i }) => Math.log(NODE_RADIUS[i]) + 3);

  const drag = (simulation) => {
    const dragStarted = (event) => {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    };

    const dragged = (event) => {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    };

    const dragEnded = (event) => {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    };

    return d3
      .drag()
      .on("start", dragStarted)
      .on("drag", dragged)
      .on("end", dragEnded);
  };

  node.call(drag(simulation));

  function nodeClicked(event, d, nodeStroke, linkStrokeWidth) {
    if (event.defaultPrevented) return; // dragged

    // clear highlight left
    clearSelectedHighlight(nodeStroke, linkStrokeWidth);

    d3.select(this)
      .transition()
      .attr("stroke-width", "3px")
      .attr("r", ({ index: i }) => Math.log(NODE_RADIUS[i]) + 7);

    // get node info from backend
    let formData = new FormData();
    formData.append("node_id", this.id.substring(5, this.id.length));

    const req = new XMLHttpRequest();
    req.open("POST", "http://127.0.0.1:5000/get_node", true);
    req.send(formData);

    req.onreadystatechange = function () {
      if (!(req.readyState === 4 && req.status === 200)) return;

      const nodeInfo = JsonStrToMap(req.responseText);
      const nodeProperties = ObjToMap(nodeInfo.get("properties"));

      infoPanel.innerHTML =
        getCloseLink() + getNodeHtmlStr(nodeInfo, nodeProperties);

      openInfoPanel();
    };
  }

  function getNodeHtmlStr(nodeInfo, nodeProperties) {
    let htmlStr = "";

    // title
    if (nodeProperties.has("title"))
      htmlStr += getPanelTitle(nodeProperties.get("title"));
    else if (nodeProperties.has("name"))
      htmlStr += getPanelTitle(nodeProperties.get("name"));

    // node info
    for (const [key, value] of nodeInfo)
      if (key !== "properties") htmlStr += getParagraph(false, key, value);

    // property info
    htmlStr += getParagraph(false, "properties", "");
    for (const [key, value] of nodeProperties)
      htmlStr += getParagraph(true, key, value);

    return htmlStr;
  }

  function linkClicked(event, d, nodeStroke, linkStrokeWidth) {
    if (event.defaultPrevented) return; // dragged

    // clear highlight left
    clearSelectedHighlight(nodeStroke, linkStrokeWidth);

    d3.select(this).transition().attr("stroke-width", 4);

    // get link info from backend
    let formData = new FormData();
    formData.append("relationship_id", this.id.substring(5, this.id.length));

    const req = new XMLHttpRequest();
    req.open("POST", "http://127.0.0.1:5000/get_relationship", true);
    req.send(formData);

    req.onreadystatechange = function () {
      if (!(req.readyState === 4 && req.status === 200)) return;

      const linkInfo = JsonStrToMap(req.responseText);
      const linkProperties = ObjToMap(linkInfo.get("properties"));

      infoPanel.innerHTML =
        getCloseLink() + getLinkHtmlStr(linkInfo, linkProperties);

      openInfoPanel();
    };
  }

  function getLinkHtmlStr(linkInfo, linkProperties) {
    let htmlStr = "";

    // title
    htmlStr += getPanelTitle(linkInfo.get("type"));

    // relationship info
    for (const [key, value] of linkInfo)
      if (key !== "properties") htmlStr += getParagraph(false, key, value);

    // property info
    htmlStr += getParagraph(false, "properties", "");
    for (const [key, value] of linkProperties)
      htmlStr += getParagraph(true, key, value);
    return htmlStr;
  }

  // "name: zaq"
  function getParagraph(indent, key, value) {
    if (indent)
      return (
        `<p style="margin-left: 25px;"><b>` + key + `: </b>` + value + `</p>`
      );
    return `<p><b>` + key + `: </b>` + value + `</p>`;
  }

  function getPanelTitle(title) {
    return `<p style="font-size:25px;"><b>` + title + `</b></p>`;
  }

  function getCloseLink() {
    return `<p style="text-align: right;"><a href="javascript:void(0)" onclick="closeInfoPanel()">X</a></p>`;
  }

  function clearSelectedHighlight(nodeStroke, linkStrokeWidth) {
    node.attr("stroke-width", "1.5px");
    node.attr("r", ({ index: i }) => Math.log(NODE_RADIUS[i]) + 3);
    // link.attr("stroke", nodeStroke);
    link.attr("stroke-width", linkStrokeWidth);
  }

  function ObjToMap(obj) {
    const map = new Map();
    for (let key in obj) map.set(key, obj[key]);
    return map;
  }

  function JsonStrToMap(str) {
    return ObjToMap(JSON.parse(str));
  }

  function p(a) {
    console.log(a);
  }

  return Object.assign(svg.node(), {
    scales: {
      color,
    },
  });
};
