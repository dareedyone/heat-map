const url = "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json";
let drawMap = (err, data) => {
  //making month to work with zero based index
  if (!err) {
    data.monthlyVariance.forEach(val => val.month -= 1);
  }

  d3.select("#heading").
  append("h4").
  attr("id", "description").
  html(data.monthlyVariance[0].year + " - " + data.monthlyVariance[data.monthlyVariance.length - 1].year + ": base temperature " + data.baseTemperature + "&#8451;");
  const fontSize = 16;
  const width = 5 * Math.ceil(data.monthlyVariance.length / 12);
  const height = 33 * 12;
  const padding = {
    left: 9 * fontSize,
    right: 9 * fontSize,
    top: 1 * fontSize,
    bottom: 8 * fontSize };

  let tip = d3.tip().
  attr("class", "d3-tip").
  attr("id", "tooltip").
  html(function (d) {
    return d;
  }).
  direction("n").
  offset([-10, 0]);
  // console.log(tip);
  const svg = d3.select("#svgcontainer").
  append("svg").
  attr({
    width: width + padding.left + padding.right,
    height: height + padding.top + padding.bottom,
    class: "bg-light" }).

  call(tip);
  //yscale here 
  let yScale = d3.scale.ordinal().
  domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]).
  rangeRoundBands([0, height], 0, 0);
  let yAxis = d3.svg.axis().
  scale(yScale).
  tickValues(yScale.domain()).
  tickFormat(function (month) {
    let date = new Date(0);
    date.setUTCMonth(month);
    return d3.time.format.utc("%B")(date);
  }).
  orient("left").
  tickSize(10, 1);

  svg.append("g").
  classed("y-axis", true).
  attr("id", "y-axis").
  attr("transform", "translate(" + padding.left + "," + padding.top + ")").
  call(yAxis).
  append("text").
  text("Months").
  style("text-anchor", "middle").
  attr("transform", "translate(" + -7 * fontSize + "," + height / 2 + ")" + "rotate(-90)");

  //ordinal scale
  let xScale = d3.scale.ordinal().
  domain(data.monthlyVariance.map(function (val) {return val.year;})).
  rangeRoundBands([0, width], 0, 0);
  let xAxis = d3.svg.axis().
  scale(xScale).
  tickValues(xScale.domain().filter(function (year) {
    //set ticks to years divisible by 10
    return year % 10 === 0;
  })).
  tickFormat(function (year) {
    let date = new Date(0);
    date.setUTCFullYear(year);
    return d3.time.format.utc("%Y")(date);
  }).
  orient("bottom").
  tickSize(10, 1);

  svg.append("g").
  classed("x-axis", true).
  attr("id", "x-axis").
  attr("transform", "translate(" + padding.left + "," + (height + padding.top) + ")").
  call(xAxis).
  append("text").
  text("Years").
  style("text-anchor", "middle").
  attr("transform", "translate(" + width / 2 + "," + 3 * fontSize + ")");
  let legendColors = colorbrewer.RdYlBu[11].reverse();
  let legendWidth = 400;
  let legendHeight = 300 / legendColors.length;

  let variance = data.monthlyVariance.map(function (val) {
    return val.variance;
  });
  let minTemp = data.baseTemperature + Math.min.apply(null, variance);
  let maxTemp = data.baseTemperature + Math.max.apply(null, variance);

  let legendThreshold = d3.scale.threshold().
  domain(function (min, max, count) {
    let array = [];
    let step = (max - min) / count;
    let base = min;
    for (var i = 1; i < count; i++) {
      array.push(base + i * step);
    }
    return array;
  }(minTemp, maxTemp, legendColors.length)).
  range(legendColors);

  let legendX = d3.scale.linear().
  domain([minTemp, maxTemp]).
  range([0, legendWidth]);

  let legendXAxis = d3.svg.axis().
  scale(legendX).
  orient("bottom").
  tickSize(10, 0).
  tickValues(legendThreshold.domain()).
  tickFormat(d3.format(".1f"));

  let legend = svg.append("g").
  classed("legend", true).
  attr("id", "legend").
  attr("transform", "translate(" + padding.left + "," + (padding.top + height + padding.bottom - 2 * legendHeight) + ")");

  legend.append("g").
  selectAll("rect").
  data(legendThreshold.range().map(function (color) {
    let d = legendThreshold.invertExtent(color);
    if (d[0] == null) d[0] = legendX.domain()[0];
    if (d[1] == null) d[1] = legendX.domain()[1];
    return d;
  })).
  enter().append("rect").
  style("fill", function (d, i) {return legendThreshold(d[0]);}).
  attr({
    x: function (d, i) {return legendX(d[0]);},
    y: 0,
    width: function (d, i) {return legendX(d[1]) - legendX(d[0]);},
    height: legendHeight });


  legend.append("g").
  attr("transform", "translate(" + 0 + "," + legendHeight + ")").
  call(legendXAxis);

  //map
  svg.append("g").
  classed("map", true).
  attr("transform", "translate(" + padding.left + "," + padding.top + ")").
  selectAll("rect").
  data(data.monthlyVariance).
  enter().append("rect").
  attr('class', 'cell').
  attr('data-month', function (d) {
    return d.month;
  }).
  attr('data-year', function (d) {
    return d.year;
  }).
  attr('data-temp', function (d) {
    return data.baseTemperature + d.variance;
  }).
  attr({
    x: function (d, i) {
      return xScale(d.year);
    },
    y: function (d, i) {
      return yScale(d.month);
    },
    width: function (d, i) {
      return xScale.rangeBand(d.year);
    },
    height: function (d, i) {
      return yScale.rangeBand(d.month);
    } }).

  attr("fill", function (d, i) {
    return legendThreshold(data.baseTemperature + d.variance);
  }).
  on("mouseover", function (d) {
    let date = new Date(d.year, d.month);
    let str = "<span class='date'>" + d3.time.format("%Y - %B")(date) + "</span>" + "<br />" +
    "<span class='temperature'>" + d3.format(".1f")(data.baseTemperature + d.variance) + "&#8451;" + "</span>" + "<br />" +
    "<span class='variance'>" + d3.format("+.1f")(d.variance) + "&#8451;" + "</span>";
    tip.attr("data-year", d.year);
    tip.show(str);
  }).
  on("mouseout", tip.hide);

};





d3.json(url, drawMap);

const colorbrewer = {
  RdYlBu: {
    3: ["#fc8d59", "#ffffbf", "#91bfdb"],
    4: ["#d7191c", "#fdae61", "#abd9e9", "#2c7bb6"],
    5: ["#d7191c", "#fdae61", "#ffffbf", "#abd9e9", "#2c7bb6"],
    6: ["#d73027", "#fc8d59", "#fee090", "#e0f3f8", "#91bfdb", "#4575b4"],
    7: ["#d73027", "#fc8d59", "#fee090", "#ffffbf", "#e0f3f8", "#91bfdb", "#4575b4"],
    8: ["#d73027", "#f46d43", "#fdae61", "#fee090", "#e0f3f8", "#abd9e9", "#74add1", "#4575b4"],
    9: ["#d73027", "#f46d43", "#fdae61", "#fee090", "#ffffbf", "#e0f3f8", "#abd9e9", "#74add1", "#4575b4"],
    10: ["#a50026", "#d73027", "#f46d43", "#fdae61", "#fee090", "#e0f3f8", "#abd9e9", "#74add1", "#4575b4", "#313695"],
    11: ["#a50026", "#d73027", "#f46d43", "#fdae61", "#fee090", "#ffffbf", "#e0f3f8", "#abd9e9", "#74add1", "#4575b4", "#313695"] },

  RdBu: {
    3: ["#ef8a62", "#f7f7f7", "#67a9cf"],
    4: ["#ca0020", "#f4a582", "#92c5de", "#0571b0"],
    5: ["#ca0020", "#f4a582", "#f7f7f7", "#92c5de", "#0571b0"],
    6: ["#b2182b", "#ef8a62", "#fddbc7", "#d1e5f0", "#67a9cf", "#2166ac"],
    7: ["#b2182b", "#ef8a62", "#fddbc7", "#f7f7f7", "#d1e5f0", "#67a9cf", "#2166ac"],
    8: ["#b2182b", "#d6604d", "#f4a582", "#fddbc7", "#d1e5f0", "#92c5de", "#4393c3", "#2166ac"],
    9: ["#b2182b", "#d6604d", "#f4a582", "#fddbc7", "#f7f7f7", "#d1e5f0", "#92c5de", "#4393c3", "#2166ac"],
    10: ["#67001f", "#b2182b", "#d6604d", "#f4a582", "#fddbc7", "#d1e5f0", "#92c5de", "#4393c3", "#2166ac", "#053061"],
    11: ["#67001f", "#b2182b", "#d6604d", "#f4a582", "#fddbc7", "#f7f7f7", "#d1e5f0", "#92c5de", "#4393c3", "#2166ac", "#053061"] } };