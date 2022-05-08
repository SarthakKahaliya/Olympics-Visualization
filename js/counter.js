// adapted from http://jsfiddle.net/c5YVX/8/

var start_val = 0,
    duration = 10000,
    end_val2 = [300],
    end_val = [6223];


var margin = {top: 10, right: 10, bottom: 10, left: 10};

let width = document.getElementById('story').getBoundingClientRect().width - margin.left - margin.right;
let height = document.getElementById('story').getBoundingClientRect().height  - margin.top - margin.bottom;


// init drawing area

var qSVG = d3.select("#story").append("svg").attr("width", width+margin.left+margin.right).attr("height", height+margin.top+margin.bottom).attr("transform", "translate(" + margin.top + "," + margin.left + ")");

qSVG.selectAll(".txt")
    .data(end_val)
    .enter()
    .append("text")
    .text(start_val)
    .attr("class", "txt")
    .attr("x", width/2-margin.right)
    .attr("y", 60)
    .attr("fill", "#bb9b64")
    .attr("font-size", 40)
    .transition()
    .duration(duration)
    .tween("text", function(d) {
        var i = d3.interpolate(this.textContent, d),
            prec = (d + "").split("."),
            round = (prec.length > 1) ? Math.pow(80, prec[1].length) : 1;

        return function(t) {
            this.textContent = Math.round(i(t) * round) / round;
        };
    });
qSVG.append("text")
    .attr("x", 20)
    .attr("y", 60)
    .attr("fill", "black")
    .attr("font-size", 28)
    .append('svg:tspan')
    .attr("x", 100)
    .attr("y", 100)
    .text("women participated in 2016 Summer Olympics!")

var qSVG2 = d3.select("#story2").append("svg").attr("width", 900).attr("height", 170).attr("transform", "translate(" + 200 + "," + 10 + ")");

qSVG2.selectAll(".txt")
    .data(end_val2)
    .enter()
    .append("text")
    .text(start_val)
    .attr("class", "txt")
    .attr("x", 190)
    .attr("y", 60)
    .attr("fill", "#bb9b64")
    .attr("font-size", 50)
    .transition()
    .duration(duration)
    .tween("text", function(d) {
        var i = d3.interpolate(this.textContent, d),
            prec = (d + "").split("."),
            round = (prec.length > 1) ? Math.pow(10, prec[1].length) : 1;

        return function(t) {
            this.textContent = Math.round(i(t) * round) / round;
        };
    });
qSVG2.append("text")
    .attr("x", 0)
    .attr("y", 60)
    .attr("fill", "#bb9b64ff")
    .attr("font-size", 30)
    .append('svg:tspan')
    .attr("x", 0)
    .attr("y", 60)
    .text("There are only")
    .append('svg:tspan')
    .attr("x", 0)
    .attr("y", 100)
    .text("different types of Sports played by women")
    .append('svg:tspan')
    .attr("x", 0)
    .attr("y", 140)
    .text("compared to 554 types of Sports played by men.");

