
/*
 * Timeline - ES6 Class
 * @param  parentElement 	-- the HTML element in which to draw the visualization
 * @param  data             -- the data the timeline should use
 */

class Timeline {

    // constructor method to initialize Timeline object
    constructor(parentElement, data){
        this._parentElement = parentElement;
        this._data = data;
        // No data wrangling, no update sequence
        this._displayData = data;
        this.boolean = false;

        this.initVis();
    }

    // create initVis method for Timeline class
    initVis() {

        // store keyword this which refers to the object it belongs to in variable vis
        let vis = this;


        vis.margin = {top: 0, right: 40, bottom: 30, left: 10};

        vis.width = document.getElementById(vis._parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis._parentElement).getBoundingClientRect().height  - vis.margin.top - vis.margin.bottom;

        // SVG drawing area
        vis.svg = d3.select("#" + vis._parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        // Scales and axes
        vis.x = d3.scaleTime()
            .range([0, vis.width]);

        vis.y = d3.scaleLinear()
            .range([vis.height, vis.margin.bottom])

        vis.xAxis = d3.axisBottom()
            .scale(vis.x);

        // SVG area path generator
        vis.area = d3.area()
            .curve(d3.curveMonotoneX)
            .x(function (d) {
                return vis.x(d.Year);
            })
            .y0(vis.height)
            .y1(function (d) {
                return vis.y(d.F + d.M);
            });

        // TO-DO: Initialize brush component
        let brush = d3.brushX()
            .extent([[0, vis.margin.bottom-5], [vis.width, vis.height]])
            .on("brush", brushed);

        // TO-DO: Append brush component here
        vis.svg.append("g")
            .attr("class", "x brush")
            .call(brush)
            .selectAll("rect")
            .attr("y", -6)
            .attr("height", vis.height + 7);

        vis.clip = vis.svg.append("defs").append("clipPath")
            .attr("id", "clip");
        vis.cliprect = vis.clip
            .append("rect")
            .attr("width", 0)
            .attr("height", vis.height);

        // Append x-axis
        vis.Xaxis = vis.svg.append("g")
            .attr("class", "x-axis axis")
            .attr("transform", "translate(0," + vis.height + ")")

        // Draw area by using the path generator
        vis.pathapnd = vis.svg.append("path")
            .attr("fill", "#b2182b")

        vis.wrangleData();
    }
    wrangleData() {
        let vis = this;
        vis._displayData = vis._data
        vis.updateVis();
    }
    updateVis(){
        let vis = this;
        let animation_steps = 70;
        let step_delay      = 70;

        vis.x.domain(d3.extent(vis._displayData, function(d) { return d.Year; }));
        vis.y.domain([0, d3.max(vis._displayData, function(d) { return (d.F+d.M); })]);

        vis.pathapnd.datum(vis._displayData)
            .attr("d", vis.area)
            .attr("clip-path", "url(#clip)");

        let min_year = d3.min(vis._displayData, d => d.Year).getFullYear();
        let max_year = d3.max(vis._displayData, d => d.Year).getFullYear();

        //console.log(min_year,max_year)

        for (let ii = 1; ii <= animation_steps; ii++) {
            setTimeout(function() {
                let brush_width = vis.width / animation_steps * ii;
                vis.cliprect
                    .transition()
                    .ease(d3.easeLinear)
                    .duration(step_delay)
                    .attr("width", brush_width);
                mapVis_selectedTime = [min_year, (min_year + (max_year - min_year) / animation_steps * ii)];
                myMapVis.wrangleData();
                myMapBarVis.wrangleDataStatic();

            }, (ii * step_delay));
        }
        mapVis_selectedTime = [];

        vis.Xaxis.call(vis.xAxis);

    }
}