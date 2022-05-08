/* * * * * * * * * * * * * *
*          MapVis          *
* * * * * * * * * * * * * */


class MapVis {

    constructor(parentElement, geoData, olympicsData) {
        this.parentElement = parentElement;
        this.geoData = geoData;
        this.olympicsData = olympicsData;
        this.filterData = olympicsData;
        this.low = "#fddbc7"
        this.high = "#b2182b"
        this.filter = null;


        this.initVis()
    }

    initVis() {
        let vis = this;

        vis.margin = {top: 10, right: 20, bottom: 20, left: 10};

        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height  - vis.margin.top - vis.margin.bottom;

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);

        vis.colorScale = d3.scaleLinear()
            .range([vis.low, vis.high]);

        vis.projection = d3.geoMercator()
            .translate([vis.width, vis.height/2])

        vis.projection.fitSize([vis.width,vis.height+vis.margin.bottom], {
            type: "Polygon",
            coordinates: [[
                [-179.999,84] ,
                [-179.999,-57] ,
                [179.999,-57] ,
                [179.999,84],
                [-179.999,84]
            ]]
        })

        vis.path = d3.geoPath()
            .projection(vis.projection);

        vis.world = topojson.feature(vis.geoData, vis.geoData.objects.countries).features

        vis.countries = vis.svg.selectAll(".country")
            .data(vis.world)
            .enter()
            .append("path")
            .attr('class', 'country')
            .attr("d", vis.path);

        //console.log(vis.countries)

        vis.tooltip = d3.select("body").append('div')
            .attr('class', "tooltip")
            .attr('id', 'pieTooltip');

        var defs = vis.svg.append("defs");

        vis.linearGradient = defs.append("linearGradient")
            .attr("id", "linear-gradient");

        vis.legend = vis.svg.append("g")
            .attr('class', 'legend')
            .attr('transform', `translate(${vis.width/1.5}, ${vis.height - 10})`)

        vis.linearGradient
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "0%");

        //Set the color for the start (0%)
        vis.linearGradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", vis.low); //light blue

        vis.linearGradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", vis.high); //dark blue

        //Draw the rectangle and fill with gradient
        vis.legend.append("rect")
            .attr("width", 150)
            .attr("height", 20)
            .style("fill", "url(#linear-gradient)");

        vis.legScale = d3.scaleLinear()
            .range([0, 150])

        vis.legAxis = d3.axisBottom()
            .scale(vis.legScale)

        vis.axis_group = vis.svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${vis.width / 1.5}, ${vis.height + 10})`)
        //
        // vis.svg.append('g')
        //     .attr('class', 'title map-title')
        //     .append('text')
        //     .text('Map - Number of medals by country since 1876')
        //     .attr('transform', `translate(${vis.width / 6}, ${vis.height - 20})`)
        //     .attr('text-anchor', 'middle');

        vis.wrangleData()

    }

    wrangleData() {
        let vis = this;

        if ((mapVis_selectedTime.length !== 0) && (mapVis_selectedTime[1] !== 2016)){
            vis.Data = vis.olympicsData.filter(function (d) {
                return (d.Year <= mapVis_selectedTime[1]) && (d.Year >= mapVis_selectedTime[0]);
            })
        } else {
            vis.Data = vis.filterData;
        }

        vis.filterData = vis.Data;

        // create random data structure with information for each land
        vis.countryInfo = [];
        vis.olympicInfo = {};

        let SurveyCount = d3.group(vis.filterData, d=>d.PlayerCountry);

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
            else {
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


    updateVis() {
        let vis = this;

        let maxVal = d3.max(vis.countryInfo, function (d) {
                return d.total;
        });

        let minVal = d3.min(vis.countryInfo, function (d) {
            return d.total;
        });

        vis.colorScale.domain([minVal,maxVal])

        vis.legScale.domain([minVal, maxVal])
        vis.legAxis.tickValues( vis.legScale.ticks(0).concat(vis.legScale.domain()));
        vis.axis_group.call(vis.legAxis)

        vis.countries
            .style("fill", d => {
                if(d.properties.name === selection){
                    return "yellow"
                }
                if(vis.olympicInfo[d.properties.name])
                    return vis.colorScale(vis.olympicInfo[d.properties.name].total)

                else{
                    return "black"
                }
            })
            .attr('stroke-width', '1px')
            .attr('stroke', 'grey')
            .on('click', function (event, d) {
                console.log("Hello")
            })
            .on('mouseover', function(event, d){
                d3.select(this)
                    .attr('stroke-width', '2px')
                    .attr('stroke', 'black')
                    .style('fill', 'yellow')

                vis.tooltip
                    .style("opacity", 1)
                    .style("left", event.pageX + 20 + "px")
                    .style("top", event.pageY + "px")
                    .html(`
                     <div style="border: thin solid grey; border-radius: 5px; background: #ffffed; padding: 20px">
                         <h4>${d.properties.name}<h3>
                         <h5> <i class="fas fa-medal" style="color: gold"></i>: ${vis.olympicInfo[d.properties.name].gold}</h5>
                         <h5> <i class="fas fa-medal" style="color: silver"></i>: ${vis.olympicInfo[d.properties.name].silver}</h5>
                         <h5> <i class="fas fa-medal" style="color: #CD7F32"></i>: ${vis.olympicInfo[d.properties.name].bronze}</h5>   
                         <h5> Total : ${vis.olympicInfo[d.properties.name].total}</h5> 
                     </div>`);

                selection = d.properties.name
                myMapBarVis.updateVis()
            })
            .on('mouseout', function(event, d){
                d3.select(this)
                    .attr('stroke-width', '1px')
                    .attr('stroke', 'grey')
                    .style("fill", d => {
                        if(vis.olympicInfo[d.properties.name])
                            return vis.colorScale(vis.olympicInfo[d.properties.name].total)

                        else{
                            return "black"
                        }
                    })

                vis.tooltip
                    .style("opacity", 0)
                    .style("left", 0)
                    .style("top", 0)
                    .html(``);

                selection = ''
                myMapBarVis.updateVis()
            })
    }
    brushingChange(selectionDomain) {
        let vis = this;
        let parseDate = d3.timeParse("%Y");
        let brushedData = vis.olympicsData.filter(function(d) { return (parseDate(d.Year)>=selectionDomain[0]) && (parseDate(d.Year)<=selectionDomain[1]) })
        //console.log(brushedData);
        vis.filterData = brushedData;
        vis.wrangleData();
    }
}