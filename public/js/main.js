import { forceGraph } from "./chart.js";

// get all nodes and links from backend
const httpRequest = new XMLHttpRequest();
httpRequest.open("GET", "http://127.0.0.1:5000/query_all", true);
httpRequest.send();

// after getting response, function in the right will be called
httpRequest.onreadystatechange = function () {
  let data;
  if (httpRequest.readyState === 4 && httpRequest.status === 200) {
    // get response (json but in string)
    const queryAllRes = httpRequest.responseText;
    data = JSON.parse(queryAllRes);
    console.log(data);
  } else return;

  const infoPanel = document.getElementById("info-panel");

  // make graph
  const chart = forceGraph(data, {
    infoPanel: infoPanel,
    width: window.innerWidth,
    height: window.innerHeight,
  });

  d3.select("body").append(() => chart);
};
