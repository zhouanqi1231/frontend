function Histogram(
  data,
  {
    x = 1,
    y = (d, i) => i,
    title,
    marginTop = 30,
    marginRight = 0,
    marginBottom = 10,
    marginLeft = 45,
    width = 640,
    height = 640,
    xType = d3.scaleLinear,
    xDomain,
    xRange = [marginLeft, width - marginRight],
    xFormat,
    xLabel,
    yPadding = 0.1,
    yDomain,
    yRange,
    color = "currentColor",
    titleColor = "white",
    titleAltColor = "currentColor",
  } = {}
) {
  //映射X，Y
  const X = d3.map(data, x);
  console.log(X);
  const Y = d3.map(data, y);
  for (let i = 0; i < Y.length; i++) {
    X[i] = 0;
  }
  for (let i = 0; i < Y.length; i++) {
    for (let j = 0; j < i; j++) {
      if (Y[j] == Y[i]) {
        continue;
      }
    }
    for (let j = 0; j < Y.length; j++) {
      if (Y[j] == Y[i]) {
        X[i]++;
      }
    }
  }
  for (let i = 0; i < Y.length; i++) {
    for (let j = 0; j < i; j++) {
      if (X[i] < X[j]) {
        const Y0 = Y[i];
        const X0 = X[i];
        Y[i] = Y[j];
        X[i] = X[j];
        Y[j] = Y0;
        X[j] = X0;
      }
    }
  }

  //化为频率
  for (let i = 0; i < Y.length; i++) {
    X[i] /= 1000;
  }
  if (xDomain === undefined) xDomain = [0, d3.max(X)];
  if (yDomain === undefined) yDomain = Y;
  yDomain = new d3.InternSet(yDomain);
  const I = d3.range(X.length).filter((i) => yDomain.has(Y[i]));
  if (height === undefined)
    height =
      Math.ceil((yDomain.size + yPadding) * 25) + marginTop + marginBottom;
  if (yRange === undefined) yRange = [marginTop, height - marginBottom];
  const xScale = xType(xDomain, xRange);
  const yScale = d3.scaleBand(yDomain, yRange).padding(yPadding);
  const xAxis = d3.axisTop(xScale).ticks(width / 80, xFormat);
  const yAxis = d3.axisLeft(yScale).tickSizeOuter(0);
  if (title === undefined) {
    const formatValue = xScale.tickFormat(100, xFormat);
    title = (i) => `${formatValue(X[i])}`;
  } else {
    const O = d3.map(data, (d) => d);
    const T = title;
    title = (i) => T(O[i], i, data);
  }
  const formatValue = xScale.tickFormat(100, xFormat);
  const svg1 = d3
    .select("#mysvg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto; height: intrinsic;");
  //x轴描绘
  svg1
    .append("g")
    .attr("transform", `translate(0,${marginTop})`)
    .call(xAxis)
    .call((g) =>
      g
        .selectAll(".tick line")
        .clone()
        .attr("y2", height - marginTop - marginBottom)
        .attr("stroke-opacity", 0.1)
    )
    .call((g) =>
      g
        .append("text")
        .attr("x", width - marginRight)
        .attr("y", -22)
        .attr("fill", "black")
        .attr("text-anchor", "end")
        .text(xLabel)
    );
  //矩形描绘
  svg1
    .append("g")
    .attr("fill", color)
    .selectAll("rect")
    .data(I)
    .join("rect")
    .attr("x", xScale(0))
    .attr("y", (i) => yScale(Y[i]))
    .attr("width", (i) => xScale(X[i]) - xScale(0))
    .attr("height", yScale.bandwidth());
  //百分数描绘
  svg1
    .append("g")
    .attr("fill", titleColor)
    .attr("text-anchor", "end")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .selectAll("text")
    .data(I)
    .join("text")
    .attr("x", (i) => xScale(X[i]))
    .attr("y", (i) => yScale(Y[i]) + yScale.bandwidth() / 2)
    .attr("dy", "0.35em")
    .attr("dx", -4)
    .text(title)
    .call((text) =>
      text
        .filter((i) => xScale(X[i]) - xScale(0) < 20) // short bars
        .attr("dx", +4)
        .attr("fill", titleAltColor)
        .attr("text-anchor", "start")
    );
  //y轴描绘
  svg1.append("g").attr("transform", `translate(${marginLeft},0)`).call(yAxis);

  return svg1.node();
}
