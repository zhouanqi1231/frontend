export const forceGraph = (
  {
    nodes, // an iterable of node objects (typically [{id}, …])
    links, // an iterable of link objects (typically [{source, target}, …])
  },
  {
    infoPanel,
    svgId = "force-graph",
    nodeId = (d) => d.id, // given d in nodes, returns a unique identifier (string)
    nodeGroup, // given d in nodes, returns an (ordinal) value for color
    nodeGroups, // an array of ordinal values representing the node groups
    nodeFill = "currentColor", // node stroke fill (if not using a group color encoding)
    nodeStroke = "#fff", // node stroke color
    nodeStrokeWidth = 1.5, // node stroke width, in pixels
    nodeStrokeOpacity = 1, // node stroke opacity
    nodeRadius = 5, // node radius, in pixels
    nodeStrength,
    linkId = (d) => d.id,
    linkSource = ({ source }) => source, // given d in links, returns a node identifier string
    linkTarget = ({ target }) => target, // given d in links, returns a node identifier string
    linkStroke = "#999", // link stroke color
    linkStrokeOpacity = 0.6, // link stroke opacity
    linkStrokeWidth = 4, // given d in links, returns a stroke width in pixels
    linkStrokeLinecap = "round", // link stroke linecap
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
    width, // w&h for graph
    height,
  } = {}
) => {
  const intern = (value) =>
    value !== null && typeof value === "object" ? value.valueOf() : value;

  // Compute values.
  const NODEID = d3.map(nodes, nodeId).map(intern);
  const NODEGROUP =
    nodeGroup == null ? null : d3.map(nodes, nodeGroup).map(intern);

  const LINKID = d3.map(links, linkId).map(intern);
  const LINKSOURCE = d3.map(links, linkSource).map(intern);
  const LINKTARGET = d3.map(links, linkTarget).map(intern);
  const LINKSTROKE =
    typeof linkStroke !== "function" ? null : d3.map(links, linkStroke);
  const NODERADIUS =
    typeof nodeRadius !== "function" ? null : d3.map(nodes, nodeRadius);

  // Replace the input nodes and links with mutable objects for the simulation.
  nodes = d3.map(nodes, (_, i) => ({
    id: NODEID[i],
  }));
  links = d3.map(links, (_, i) => ({
    source: LINKSOURCE[i],
    target: LINKTARGET[i],
    id: LINKID[i],
  }));

  // Compute default domains.
  if (NODEGROUP && nodeGroups === undefined) nodeGroups = d3.sort(NODEGROUP);

  // Construct the scales.
  const color = nodeGroup == null ? null : d3.scaleOrdinal(nodeGroups, colors);

  // node之间的力
  const forceNode = d3.forceManyBody();
  if (nodeStrength !== undefined) forceNode.strength(nodeStrength);

  const svg = d3
    .create("svg")
    .attr("id", svgId)
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [-width / 2, -height / 2, width, height])
    .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

  const link = svg
    .append("g")
    .attr("stroke", typeof linkStroke !== "function" ? linkStroke : null)
    .attr("stroke-opacity", linkStrokeOpacity)
    .attr("stroke-width", linkStrokeWidth)
    .attr("stroke-linecap", linkStrokeLinecap)
    .selectAll("line")
    .data(links)
    .join("line")
    .attr("id", (d) => "link-" + d.id);

  const node = svg
    .append("g")
    .attr("fill", nodeFill)
    .attr("stroke", nodeStroke)
    .attr("stroke-opacity", nodeStrokeOpacity)
    .attr("stroke-width", nodeStrokeWidth)
    .selectAll("circle")
    .data(nodes)
    .join("circle")
    .attr("r", typeof nodeRadius !== "function" ? nodeRadius : null)
    .attr("id", (d) => "node-" + d.id)
    .attr("original-fill", (d) => "node-" + d.id);

  const simulation = d3
    .forceSimulation(nodes)
    .force(
      "link",
      d3.forceLink(links).id(({ index: i }) => NODEID[i])
    )
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

  const drag = (simulation) => {
    const dragstarted = (event) => {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    };

    const dragged = (event) => {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    };

    const dragended = (event) => {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    };

    return d3
      .drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  };

  node.call(drag(simulation));

  if (NODEGROUP) node.attr("fill", ({ index: i }) => color(NODEGROUP[i]));
  if (NODERADIUS)
    node.attr("r", ({ index: i }) => Math.sqrt(NODERADIUS[i]) + 3);

  svg.selectAll("circle").on("click", nodeClicked);
  svg.selectAll("line").on("click", linkClicked);

  function nodeClicked(event, d, nodeStroke, linkStrokeWidth) {
    if (event.defaultPrevented) return; // dragged

    // 清除上次的选中效果，添加本次选中效果
    clearHighlight(nodeStroke, linkStrokeWidth);

    d3.select(this)
      .transition()
      .attr("fill", "black")
      .attr("r", ({ index: i }) => Math.sqrt(NODERADIUS[i]) + 7);

    // 向后端发请求 表单传参
    let formData = new FormData();
    formData.append("node_id", this.id.substring(5, this.id.length));

    const req = new XMLHttpRequest();
    req.open("POST", "http://127.0.0.1:5000/get_node", true);
    req.send(formData);

    req.onreadystatechange = function () {
      if (!(req.readyState == 4 && req.status == 200)) return;

      var json = req.responseText;
      var nodeInfo = JsonStrToMap(json);
      var nodeProperties = ObjToMap(nodeInfo.get("properties"));

      infoPanel.innerHTML =
        getCloseLink() + getNodeHtmlStr(nodeInfo, nodeProperties);
      openInfoPanel();
    };
  }

  function getNodeHtmlStr(nodeInfo, nodeProperties) {
    var htmlStr = "";

    // title
    if (nodeProperties.has("title"))
      htmlStr += getPanelTitle(nodeProperties.get("title"));
    if (nodeProperties.has("name"))
      htmlStr += getPanelTitle(nodeProperties.get("name"));

    // node info
    for (var [key, value] of nodeInfo)
      if (key != "properties") htmlStr += getParagraph(false, key, value);

    // node properties
    htmlStr += getParagraph(false, "properties", "");

    for (var [key, value] of nodeProperties)
      htmlStr += getParagraph(true, key, value);

    return htmlStr;
  }

  function linkClicked(event, d, nodeStroke, linkStrokeWidth) {
    if (event.defaultPrevented) return; // dragged

    // 清除上次的选中效果
    clearHighlight(nodeStroke, linkStrokeWidth);

    d3.select(this)
      .transition()
      .attr("stroke", "black")
      .attr("stroke-width", 8);

    // 向后端发请求
    let formData = new FormData();
    formData.append("relationship_id", this.id.substring(5, this.id.length));

    const req = new XMLHttpRequest();
    req.open("POST", "http://127.0.0.1:5000/get_relationship", true);
    req.send(formData);

    req.onreadystatechange = function () {
      if (!(req.readyState == 4 && req.status == 200)) return;

      var json = req.responseText;
      var linkInfo = JsonStrToMap(json);
      var linkProperties = ObjToMap(linkInfo.get("properties"));

      infoPanel.innerHTML =
        getCloseLink() + getLinkHtmlStr(linkInfo, linkProperties);
      openInfoPanel();
    };
  }

  function getLinkHtmlStr(linkInfo, linkProperties) {
    var htmlStr = "";
    htmlStr += getPanelTitle(linkInfo.get("type"));

    for (var [key, value] of linkInfo)
      if (key != "properties") htmlStr += getParagraph(false, key, value);

    htmlStr += getParagraph(false, "properties", "");
    for (var [key, value] of linkProperties)
      htmlStr += getParagraph(true, key, value);
    return htmlStr;
  }

  // 返回blk: name: zaq
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
    return `<p align="right"><a href="javascript:void(0)" onclick="closeInfoPanel()" color="#fff">X</a></p>`;
  }

  function clearHighlight(nodeStroke, linkStrokeWidth) {
    node.attr("fill", ({ index: i }) => color(NODEGROUP[i]));
    node.attr("r", ({ index: i }) => Math.sqrt(NODERADIUS[i]) + 3);
    link.attr("stroke", nodeStroke);
    link.attr("stroke-width", linkStrokeWidth);
  }

  function ObjToMap(obj) {
    var map = new Map();
    for (let key in obj) {
      map.set(key, obj[key]);
    }
    return map;
  }

  function JsonStrToMap(str) {
    return ObjToMap(JSON.parse(str));
  }

  return Object.assign(svg.node(), {
    scales: {
      color,
    },
  });
};
