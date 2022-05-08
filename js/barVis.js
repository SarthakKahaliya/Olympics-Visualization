class BarVis {

    constructor(parentElement, olympicsData, title) {
        this.parentElement = parentElement;
        this.olympicsData = olympicsData;
        this.filtered_data = olympicsData;
        this.title = title;
        this.low = "white"
        this.high = "#428A8D"
        this.filter = null;

        this.colors = ['pink','lightblue'];

        this.initVis()

    }

    initVis()
    {
        let vis = this;

        vis.margin = {top: 75, right: 20, bottom: 20, left: 80};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;


        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append('g')
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);

        vis.bar_text = vis.svg.append('g')
            .attr('class', 'title bar-title')
            .append('text')
            .attr('transform', `translate(${(vis.width/2)}, 2)`)
            .attr('text-anchor', 'middle')
            .text(vis.title);

        vis.x = d3.scaleTime()
            .range([0, vis.width])

        vis.y = d3.scaleLinear()
            .range([vis.height - vis.margin.bottom, vis.margin.top]);

        vis.xAxis = d3.axisBottom()
            .scale(vis.x);

        vis.yAxis = d3.axisLeft()
            .scale(vis.y);

        vis.svg.append("g")
            .attr("class", "x-axis axis")
            .attr("transform", "translate(0," + (vis.height - vis.margin.bottom) + ")");

        vis.svg.append("g")
            .attr("class", "y-axis axis")
            .attr("transform", "translate(" + 0 + ",0)");

        vis.stack = d3.stack()

        vis.area = d3.area()
            .curve(d3.curveMonotoneX)
            .x(d=> vis.x(d.data.Year))
            .y0(d=> vis.y(d[0]))
            .y1(d=>vis.y(d[1]));

        vis.singlearea = d3.area()
            .curve(d3.curveMonotoneX)
            .x(d => vis.x(d.data.Year))
            .y0((vis.height-vis.margin.bottom))
            .y1(d => vis.y(d[1]-d[0]));

        vis.tooltip_group = vis.svg.append("g")
            .attr("class","tooltip-group");

        vis.tooltip_group.append("line")
            .attr("x1",0)
            .attr("x2", 0)
            .attr("y1",vis.margin.top)
            .attr("y2", vis.height-vis.margin.bottom)
            .attr("stroke","red");
        vis.tooltip_group.append("text")
            .attr("dx", 30)
            .attr("dy", vis.margin.top+10)
            .attr("class","tooltip_men");
        vis.tooltip_group.append("text")
            .attr("dx", 30)
            .attr("dy", vis.margin.top+vis.margin.bottom+10)
            .attr("class","tooltip_women");
        vis.tooltip_group.append("text")
            .attr("dx", 30)
            .attr("dy", vis.margin.top+vis.margin.bottom+vis.margin.top/2)
            .attr("class","tooltip_year");

        vis.legend = vis.svg.append("g")
            .attr('class', 'legend')
            .attr('transform', `translate(0, 10)`)

        vis.legend.append('rect')
            .attr('x',30)
            .attr('y',10)
            .attr('width',20)
            .attr('height',20)
            .style('fill','pink')
        vis.legend.append('text')
            .attr('x',60)
            .attr('y',25)
            .text("Women")

        vis.legend.append('rect')
            .attr('x',150)
            .attr('y',10)
            .attr('width',20)
            .attr('height',20)
            .style('fill','lightblue')
        vis.legend.append('text')
            .attr('x',180)
            .attr('y',25)
            .text("Men")


        vis.wrangleData();

    }

    wrangleData() {
        let vis = this;

        //vis.dataCategories = Object.keys(vis.filtered_data[0]).filter(d=> d !== "Year")
        vis.dataCategories = ["F", "M"]

        // prepare colors for range
        vis.colorArray = vis.dataCategories.map( (d,i) => {
            return vis.colors[i%2]
        })

        vis.bisectDate = d3.bisector(d=>d.Year).left;

        vis.colorScale = d3.scaleOrdinal()
            .domain(vis.dataCategories)
            .range(vis.colorArray);

        vis.stack.keys(vis.dataCategories);
        vis.stackedData = vis.stack(vis.filtered_data);

        if(vis.filter) {
            let indexOfFilter = vis.dataCategories.findIndex(d=> d === vis.filter);
            vis.displayData = [vis.stackedData[indexOfFilter]];
        }
        else
            vis.displayData = vis.stackedData;



        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        vis.x.domain(d3.extent(vis.filtered_data, d=> d.Year));

        vis.y.domain([0, d3.max(vis.displayData, function(d) {
            return d3.max(d, function(e) {
                if(vis.filter){
                    return e[1]-e[0];
                }
                else
                    return e[1];
            });
        })
        ]);

        let categories = vis.svg.selectAll(".area")
            .data(vis.displayData);

        categories.enter().append("path")
            .attr("class", "area")
            .merge(categories)
            .style("fill", function(d) {
                if (vis.filter) {
                    if(vis.filter === 'M')
                        return "lightblue";
                    else
                        return 'pink';
                }
                else
                    return vis.colorScale(d);
            })
            .attr("d", function(d) {
                if (vis.filter) {
                    return vis.singlearea(d);
                }
                else
                    return vis.area(d);
            })
            /*.on("click", (d,i)=> {
                vis.filter = (vis.filter) ? "" : i.key;
                vis.wrangleData();
            })*/

        categories.exit().remove();

        vis.rect = vis.tooltip_group.append("rect")
            .attr("x", 0)
            .attr("y", vis.margin.top)
            .attr("width", vis.width)
            .attr("height", vis.height - vis.margin.bottom)
            .attr("fill","none")
            .attr("pointer-events","all")
            .on("mouseover", function (event) {
                vis.tooltip_group.style("visibility","visible");
            })
            .on("mouseout", function (event) {
                vis.tooltip_group.style("visibility","hidden");
            })
            .on("mousemove",function(event) {
                let m = d3.pointer(event)[0],
                    x0 = vis.x.invert(m),
                    i = vis.bisectDate(vis.filtered_data, x0, 1),
                    d0 = vis.filtered_data[i - 1],
                    d1 = vis.filtered_data[i],
                    d= x0 - d0.Year > d1.Year - x0 ? d1 : d0;

                vis.tooltip_group.select("line")
                    .attr("x1", m)
                    .attr("x2", m);

                vis.tooltip_group.select(".tooltip_men")
                    .text("Number of Men: " + d.M)
                vis.tooltip_group.select(".tooltip_women")
                    .text("Number of Women: " + d.F)
                vis.tooltip_group.select(".tooltip_year")
                    .text("In Year: " + d.Year.getFullYear())

            });

        // Call axis functions with the new domain
        vis.svg.select(".x-axis").call(vis.xAxis);
        vis.svg.select(".y-axis").call(vis.yAxis);

    }
}
