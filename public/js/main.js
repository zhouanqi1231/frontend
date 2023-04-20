import { forceGraph } from "./chart.js";

// get json response from backend
const httpRequest = new XMLHttpRequest();
httpRequest.open("GET", "http://127.0.0.1:5000/query_all", true);
httpRequest.send();

// 接受到response之后（左侧变量发生改变），右侧函数被回调
httpRequest.onreadystatechange = function () {
  // store response json
  let data;
  if (httpRequest.readyState === 4 && httpRequest.status === 200) {
    // get response (json but in string)
    const queryAllRes = httpRequest.responseText;
    data = JSON.parse(queryAllRes);
    console.log(data);
  } else {
    return;
  }

  const chart = forceGraph(data, {
    document,
    nodeId: (d) => d.node_id,
    linkId: (d) => d.relationship_id,
    nodeGroup: (d) => d.label,
    nodeTitle: (d) => `${d.node_id}\n${d.label}`,
    // linkStrokeWidth: (l) => Math.sqrt(l.value),
    width: window.innerWidth,
    height: window.innerHeight,
    nodeStrength: -18,
    nodeRadius: (d) => d.value,
  });

  d3.select("body").append(() => chart);
};

function openInfoPanel() {
  document.getElementById("info-panel").style.display = "block";
}

function closeInfoPanel() {
  document.getElementById("info-panel").style.display = "none";
}
