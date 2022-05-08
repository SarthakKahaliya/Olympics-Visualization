/* * * * * * * * * * * * * *
*         PieChart         *
* * * * * * * * * * * * * */


class PieChart {

    // constructor method to initialize Timeline object
    constructor(parentElement, olympicsData) {
        this.parentElement = parentElement;
        this.olympicsData = olympicsData;
        this.filterData = olympicsData;
        this.circleColors = ['lightblue','pink','#fddbc7'];

        this.initVis()
    }

    initVis() {
        let vis = this;

        // margin conventions
        vis.margin = {top: 10, right: 50, bottom: 10, left: 50};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        // add title
        vis.svg.append('g')
            .attr('class', 'title pie-title')
            .append('text')
            .text('Gender wise Sports Distribution')
            .attr('transform', `translate(${vis.width / 2}, ${vis.height / 5})`)
            .attr('text-anchor', 'middle');

        vis.pieChartGroup = vis.svg
            .append('g')
            .attr('class', 'pie-chart')
            .attr("transform", "translate(" + vis.width/2 + "," + vis.height / 2 + ")");

        vis.pie = d3.pie().value(d => d.value);

        vis.color = d3.scaleOrdinal(d3.schemeCategory10);

        vis.arc = d3.arc()
            .innerRadius(vis.width/2.9)
            .outerRadius(0);

        vis.tooltip = d3.select("body").append('div')
            .attr('class', "tooltip")
            .attr('id', 'pieTooltip')

        vis.legend = vis.svg.append("g")
            .attr('class', 'legend')
            .attr('transform', `translate(${vis.margin.left}, ${vis.height-vis.height/4})`)

        vis.legend.append('rect')
            .attr('x',30)
            .attr('y',10)
            .attr('width',20)
            .attr('height',20)
            .style('fill','pink')
        vis.legend.append('text')
            .attr('x',60)
            .attr('y',25)
            .text("Women's Sports")

        vis.legend.append('rect')
            .attr('x',30)
            .attr('y',40)
            .attr('width',20)
            .attr('height',20)
            .style('fill','lightblue')
        vis.legend.append('text')
            .attr('x',60)
            .attr('y',55)
            .text("Men's Sports")

        vis.legend.append('rect')
            .attr('x',30)
            .attr('y',70)
            .attr('width',20)
            .attr('height',20)
            .style('fill','#fddbc7')
        vis.legend.append('text')
            .attr('x',60)
            .attr('y',85)
            .text("Mixed Sports")

        // call next method in pipeline
        this.wrangleData();
    }

    // wrangleData method
    wrangleData() {
        let vis = this

        vis.displayData = []
        let men = 0, women = 0, mixed = 0, count = 0;
        let unique_sports = Array.from(d3.group(vis.filterData, function(d){return d.Event;}))
        //console.log(unique_sports)
        for (let i=0; i< unique_sports.length; i++) {
            let words = unique_sports[i][0].toLowerCase();
            count += 1;
            if(words.includes("women"))
                women += 1;
            else if (words.includes("men")) {
                men += 1;
            }
            else if (words.includes("mixed"))
                mixed += 1;
        }
        vis.displayData.push(
            {
                name: "Men's Sports",
                value: men,
                color: vis.circleColors[0]
            },
            {
                name: "Women's Sports",
                value: women,
                color: vis.circleColors[1]
            },
            {
                name: "Mixed Sports",
                value: mixed,
                color: vis.circleColors[2]
            })

        vis.updateVis()

    }

    // updateVis method
    updateVis() {
        let vis = this;


        vis.arcs = vis.pieChartGroup.selectAll(".arc")
            .data(vis.pie(vis.displayData))

        vis.arcs.enter()
            .append("path")
            .merge(vis.arcs)
            .attr("d", vis.arc)
            .style("fill", d => d.data.color)
            .on('mouseover', function(event, d){
                d3.select(this)
                    .attr('stroke-width', '2px')
                    .attr('stroke', 'black')
                    .attr('fill', 'rgba(173,222,255,0.62)')
                vis.tooltip
                    .style("opacity", 1)
                    .style("left", event.pageX + 20 + "px")
                    .style("top", event.pageY + "px")
                    .html(`
                     <div style="border: thin solid grey; border-radius: 5px; background: #ffffed; padding: 10px">
                         <h4> ${d.data.name} <h3>
                         <h5> Total: ${d.value}</h5>                                
                     </div>`);
            })
            .on('mouseout', function(event, d){
                d3.select(this)
                    .attr('stroke-width', '0px')
                    .attr("fill", d => d.data.color)

                vis.tooltip
                    .style("opacity", 0)
                    .style("left", 0)
                    .style("top", 0)
                    .html(``);
            });

        vis.arcs.exit().remove();
    }
}