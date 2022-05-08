
class BarVisGlobal {

    constructor(parentElement,  geoData, olympicsData) {
        this.parentElement = parentElement;
        this.geoData = geoData;
        this.olympicsData = olympicsData;
        this.filtered_data = olympicsData;
        this.low = "#fddbc7";
        this.high = "#b2182b";
        this.filter = null;
        this.initVis()
    }

    initVis(){
        let vis = this;

        // margin conventions
        vis.margin = {top: 10, right: 10, bottom: 10, left: 60};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width  - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height  - vis.margin.top - vis.margin.bottom;

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + (vis.margin.top) + ")");


        // append tooltip
        vis.tooltip = d3.select("body").append('div')
            .attr('class', "tooltip")
            .attr('id', 'barTooltip')



        // AXIS
        vis.x = d3.scaleLinear()
            .range([vis.margin.left, vis.width * 0.75]);

        vis.y = d3.scaleBand()
            .range([0, vis.height])
            .padding(.2);

        vis.xAxis = d3.axisBottom()
            .scale(vis.x);

        vis.yAxis = d3.axisLeft()
            .scale(vis.y);

        vis.svg.append("g")
            .attr('class', 'x-axis axis')
            .attr('id', 'bar-x-axis')
            .attr("transform", "translate(0," + vis.height + ")")

        vis.svg.append("g")
            .attr('class', 'y-axis axis')
            .attr('id', 'bar-y-axis')
            .attr("transform", "translate(" + vis.margin.left + ",0)");


        // Create y label
        // vis.svg.append("text")
        //     .attr("text-anchor", "end")
        //     .attr("class", "label")
        //     .attr("font-size","8px")
        //     .attr("fill","#6F7B7F")
        //     .attr("x", 40)
        //     .attr("y", -3)
        //     .text("Liter/Capita");

        // call next method in pipeline
        this.wrangleDataStatic();
    }

    // wrangleData method
    wrangleDataStatic(){
        let vis = this;

        if ((mapVis_selectedTime.length !== 0) && (mapVis_selectedTime[1] !== 2016)){
            vis.Data = vis.olympicsData.filter(function (d) {
                return (d.Year <= mapVis_selectedTime[1]) && (d.Year >= mapVis_selectedTime[0]);
            })
        } else {
            vis.Data = vis.filtered_data;
        }

        vis.filtered_data = vis.Data;

        // create random data structure with information for each land
        vis.countryInfo = [];
        vis.olympicInfo = {};

        let SurveyCount = d3.group(vis.filtered_data, d=>d.PlayerCountry);
        //console.log(SurveyCount);

        vis.geoData.objects.countries.geometries.forEach(d => {

            if(SurveyCount.get(d.properties.name)) {
                let data = SurveyCount.get(d.properties.name);
                let medalCountdata = d3.rollups(data,leaves=>leaves.length,function(d) {if(d.Medal !== "") return d.Medal});

                medalCountdata.sort()

                let med = Object.fromEntries(medalCountdata)

                // let medals = this.CountMedal(medalCountdata);
                // console.log(medals)

                vis.handler = {
                    get: function(target, name) {
                        return target.hasOwnProperty(name) ? target[name] : 0;
                    }
                };

                vis.p = new Proxy(med, vis.handler);

                vis.olympicInfo[d.properties.name] = {
                    name: d.properties.name,
                    none: vis.p.none,
                    silver: vis.p.Silver,
                    bronze: vis.p.Bronze,
                    gold: vis.p.Gold,
                    total: vis.p.Silver + vis.p.Gold + vis.p.Bronze
                }

                vis.countryInfo.push(
                    {
                        name: d.properties.name,
                        none: vis.p.none,
                        silver: vis.p.Silver,
                        bronze: vis.p.Bronze,
                        gold: vis.p.Gold,
                        total: vis.p.Silver + vis.p.Gold + vis.p.Bronze
                    }
                )
            }
            else{
                vis.olympicInfo[d.properties.name] = {
                    name: d.properties.name,
                    none: 0,
                    silver: 0,
                    bronze: 0,
                    gold: 0,
                    total: 0
                }

                vis.countryInfo.push(
                    {
                        name: d.properties.name,
                        none: 0,
                        silver: 0,
                        bronze: 0,
                        gold: 0,
                        total: 0
                    }
                )
            }


        })

        //console.log(vis.countryInfo)
        //console.log(vis.olympicInfo)

        vis.updateVis()

    }


    // updateVis method
    updateVis(){
        let vis = this;

        vis.color2 = d3.scaleLinear()
            .domain([0, 100])
            .range(["#FFD6B3", "#f93700"])


        vis.info = Object.values(vis.countryInfo).filter(d=>d.total !== 0);

        vis.top10Data = vis.info.sort((a,b) => {return b.total - a.total}).slice(0,10)

        let maxVal = d3.max(vis.top10Data, function (d) {
            return d.total;
        });

        let minVal = d3.min(vis.countryInfo, function (d) {
            return d.total;
        });

        vis.colorScale = d3.scaleLinear()
            .domain([minVal, maxVal])
            .range([vis.low, vis.high]);

        //console.log("TOPPPPPP", vis.top10Data)

        vis.y.domain(vis.top10Data.map(d => d.name));
        vis.x.domain([0,  maxVal]);

        //console.log(vis.x.range())

        vis.xAxis = d3.axisBottom().scale(vis.x).ticks(0);

        vis.yAxis = d3.axisLeft().scale(vis.y)

        // ---- DRAW BARS ----
        vis.bars = vis.svg.selectAll(".bar")
            .data(vis.top10Data);




        vis.bars.enter().append("rect")
            .attr("class", "bar")
            .merge(vis.bars)
            .on('mouseover', function (event, d) {
                d3.select(this)
                    .attr('stroke-width', '1.5px')
                    .attr('stroke', 'black')
                    .attr('fill', 'yellow')
                vis.tooltip
                    .style("opacity", 1)
                    .style("left", event.pageX + 20 + "px")
                    .style("top", event.pageY + "px")
                    .html(`
                    <div>
                    <h5>${d.name}<h5>
                    <h6>${d.total} Total Medals<h6>
                    </div>`);

                selection = d.name;
                myMapVis.updateVis();
            })
            .on('mouseout', function(event, d) {
                d3.select(this)
                    .attr('stroke-width', '0px')
                    .attr('fill', function (d){
                        return vis.colorScale(d.total)
                    })
                //.attr("fill", d => vis.color(d[selectedCategory]))
                vis.tooltip
                    .style("opacity", 0)
                    .style("left", 0)
                    .style("top", 0)
                    .html(``);

                selection = "";
                myMapVis.updateVis();
            })
            .on('click', function(event,d) {

                //vis.filter = (vis.filter) ? "" : d.properties.name;
                if(vis.filter !== d.name) {
                    vis.filter = d.name;
                }
                else
                    vis.filter = null;

                eventHandler.trigger("countrySelection", vis.filter);
            })
            .attr('x', vis.x(0))
            .attr("y", d => vis.y(d.name))
            .attr("height",  vis.y.bandwidth())
            .attr("fill", d => {
                if(d.name === selection){
                    return "yellow"
                }
                else{
                    return vis.colorScale(d.total)
                }

            })
            .transition()
            .duration(500)
            .attr("width", d => vis.x(d.total));


        // vis.xAxisGroup = vis.svg.select(".x-axis")
        //     .attr("transform", "translate(-10," + vis.height  +  ")")
        //     .call(vis.xAxis)
        //     .selectAll("text")
        //     .style("text-anchor", "end")
        //     .style('opacity',0)
        //     .attr("transform", function(d) {
        //         return "rotate(-60)"
        //     });

        vis.yAxisGroup = vis.svg.select(".y-axis")
            .transition()
            .duration(500)
            .call(vis.yAxis);

        vis.bars.exit().remove();

    }

    brushingChange(selectionDomain) {
        let vis = this;
        let parseDate = d3.timeParse("%Y");
        let brushedData = vis.olympicsData.filter(function(d) { return (parseDate(d.Year)>=selectionDomain[0]) && (parseDate(d.Year)<=selectionDomain[1]) })
        //console.log(brushedData);
        vis.filtered_data = brushedData;
        vis.wrangleDataStatic();
    }
}