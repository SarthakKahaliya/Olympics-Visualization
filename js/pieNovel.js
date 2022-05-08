/* * * * * * * * * * * * * *
*         PieChart         *
* * * * * * * * * * * * * */


class PieNovel {

    // constructor method to initialize Timeline object
    constructor(parentElement, olympicsData) {
        this.parentElement = parentElement;
        this.data = olympicsData;
        this.filterData = olympicsData;

        this.initVis()
    }

    initVis() {
        let vis = this;

        // margin conventions
        vis.margin = {top: 10, right: 0, bottom: 10, left: 50};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("viewBox", [0, 0, vis.width + vis.margin.left + vis.margin.right, vis.height + vis.margin.top + vis.margin.bottom])
            .style("font", "10px sans-serif");

        vis.g = vis.svg.append("g")
            .attr("transform", `translate(${vis.width/2},${vis.height/2})`);

        function partition(data) {
            const root = d3.hierarchy(data)
                .sum(d => d.value)
                .sort((a, b) => b.value - a.value);
            return d3.partition()
                .size([2 * Math.PI, root.height + 1])
                (root);
        }

        vis.tooltip = d3.select("body").append('div')
            .attr('class', "tooltip")
            .attr('id', 'NovelTooltip');

        vis.radius = vis.width/8

        vis.countrycolor = d3.scaleOrdinal(d3.schemeCategory10);

        vis.color = { Gold:'gold', Silver:'silver', Bronze:'#CD7F32', M:'lightblue', F:'pink'}

        vis.arc = d3.arc()
            .startAngle(d => d.x0)
            .endAngle(d => d.x1)
            .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
            .padRadius(vis.radius * 1.5)
            .innerRadius(d => d.y0 * vis.radius)
            .outerRadius(d => Math.max(d.y0 * vis.radius, d.y1 * vis.radius - 1))


        vis.root = partition(vis.data);
        vis.root.each(d => d.current = d);

        vis.path = vis.g.append("g")
            .selectAll("path")
            .data(vis.root.descendants().slice(1))
            .join("path")
            .attr("fill", (d,i) => {
                //console.log(d.depth)
                if(d.depth === 1)
                    return 'white'
                else {
                    return vis.color[d.data.name];
                }
            })
            .attr('stroke-width', '1px')
            .attr('stroke', function (d){
                if (d.depth === 1)
                    return 'black';
            })
            .attr("fill-opacity", d => arcVisible(d.current) ? (d.children ? 0.8 : 0.8) : 0)
            .attr("pointer-events", d => arcVisible(d.current) ? "auto" : "none")
            .attr("d", d => vis.arc(d.current))
            .on('mouseover', function(event, d){
                d3.select(this)
                    .attr('stroke-width', '2px')
                    .attr('stroke', 'black')

                let value =0;
                if(d.depth !== 3)
                    value = d.data.length;
                else
                    value = d.data.value

                vis.tooltip
                    .style("opacity", 1)
                    .style("left", event.pageX + 20 + "px")
                    .style("top", event.pageY + "px")
                    .html(`
                     <div style="border: thin solid grey; border-radius: 5px; background: lightgrey; padding: 10px">
                         <h5>${d.data.name}<h3>
                         <h6> value: ${value}</h6>
                     </div>`);
            })
            .on('mouseout', function(event, d){
                d3.select(this)
                    .attr('stroke-width', '1px')
                    .attr('stroke', function (d){
                        if (d.depth === 1)
                            return 'black';
                    })

                vis.tooltip
                    .style("opacity", 0)
                    .style("left", 0)
                    .style("top", 0)
                    .html(``);
            });

        vis.path.filter(d => d.children)
            .style("cursor", "pointer")
            .on("click", clicked);

        /*vis.heading = vis.g.append('text')
            .attr("x", -220)
            .attr("y", -250)
            .text("Medal Distribution for top 10 countries based on gender")
            .attr("font-size",'22px')*/

        vis.label = vis.g.append("g")
            .attr("pointer-events", "none")
            .attr("text-anchor", "middle")
            .style("user-select", "none")
            .selectAll("text")
            .data(vis.root.descendants().slice(1))
            .join("text")
            .attr("dy", "0.35em")
            .attr("fill-opacity", d => +labelVisible(d.current))
            .attr("transform", d => labelTransform(d.current))
            .text(function (d) {
                if(d.data.name === 'M')
                    return 'Male';
                else if (d.data.name === 'F')
                    return 'Female';
                else
                    return d.data.name;
            });

        vis.parent = vis.g.append("circle")
            .datum(vis.root)
            .attr("r", vis.radius)
            .attr("fill", "#dbd5c9")
            .attr("pointer-events", "all")
            .on("click", clicked);

        function clicked(event, p) {
            vis.parent.datum(p.parent || vis.root);

            vis.root.each(d => d.target = {
                x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
                x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
                y0: Math.max(0, d.y0 - p.depth),
                y1: Math.max(0, d.y1 - p.depth)
            });

            const t = vis.g.transition().duration(750);

            // Transition the data on all arcs, even the ones that aren’t visible,
            // so that if this transition is interrupted, entering arcs will start
            // the next transition from the desired position.
            vis.path.transition(t)
                .tween("data", d => {
                    const i = d3.interpolate(d.current, d.target);
                    return t => d.current = i(t);
                })
                .filter(function(d) {
                    return +this.getAttribute("fill-opacity") || arcVisible(d.target);
                })
                .attr("fill-opacity", d => arcVisible(d.target) ? (d.children ? 0.9 : 0.8) : 0)
                .attr("pointer-events", d => arcVisible(d.target) ? "auto" : "none")

                .attrTween("d", d => () => vis.arc(d.current));

            vis.label.filter(function(d) {
                return +this.getAttribute("fill-opacity") || labelVisible(d.target);
            }).transition(t)
                .attr("fill-opacity", d => +labelVisible(d.target))
                .attrTween("transform", d => () => labelTransform(d.current));
        }

        function arcVisible(d) {
            return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
        }

        function labelVisible(d) {
            return d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03;
        }

        function labelTransform(d) {
            const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
            const y = (d.y0 + d.y1) / 2 * vis.radius;
            return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
        }
    }
}