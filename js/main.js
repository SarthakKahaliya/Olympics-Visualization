let scrollY,scrollX;
window.addEventListener("scroll", (event) => {
    scrollY = this.scrollY;
    scrollX = this.scrollX;
    //console.log(scrollY);
});
let myMapVis,
myBarVisOne,
myBrushVis,
myMapBarVis,myPieChart,myPieNovel;

let mapVis_selectedTime = [];
let selectedState = '';
let selection = '';
let raw_data = [];
let filtered_Data = [];

let parseDate = d3.timeParse("%Y");

let bar_text = [
    "Participation of Men and Women in Olympics over the years",
]

// load data using promises
let promises = [

    d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json"),
    d3.csv("data/cleaned_data.csv"),
];

Promise.all(promises)
    .then(function (data) {
        raw_data = data;
        filtered_Data = raw_data;
        initMainPage(data)
    })
    .catch(function (err) {
        console.log(err)
    });

let eventHandler = {
    bind: (eventName, handler) => {
        document.body.addEventListener(eventName, handler);
    },
    trigger: (eventName, extraParameters) => {
        document.body.dispatchEvent(new CustomEvent(eventName, {
            detail: extraParameters
        }));
    }
}

// initMainPage
function initMainPage(dataArray) {

    myMapVis = new MapVis('mapDiv', dataArray[0], dataArray[1]);
    myMapBarVis = new BarVisGlobal('barDiv', dataArray[0], dataArray[1]);
    myBarVisOne = new BarVis('area-chart1', prepareDataforStackedChart(dataArray[1]), bar_text[0]);
    myBrushVis = new Timeline("brushDiv", prepareDataforStackedChart(dataArray[1]));
    myPieChart = new PieChart("pieDiv", dataArray[1]);
    myPieNovel = new PieNovel("pieNovel", novelData(dataArray[1]));
}

function novelData(filterData){
    let dataset = {}
    let mf = []
    let finalData = []

    let CountryGroup = Array.from(d3.group(filterData, d=>d.PlayerCountry));
    let l1=0;
    CountryGroup.forEach(function(d) {
        d.forEach(k => {
            dataset[d[0]]= Array.from(d3.group(k, k=>k.Medal));
        })
        let name;
        if(d[0] === 'United Kingdom')
            name = 'UK'
        else if(d[0] === 'United States of America')
            name = 'USA'
        else
            name = d[0]
        finalData.push(
            {
                children: [],
                name: name,
                length:0
            }
        )
        let objIndex = 0;
        dataset[d[0]].forEach(k => {
            mf= Array.from(d3.rollup(k[1], k=>k.length, k=>k.Sex));
            objIndex = finalData.findIndex((obj => obj.name === name));
            if(k[0] !== 'none') {
                finalData[objIndex].children.push(
                    {
                        children: [],
                        length: k[1].length,
                        name: k[0]
                    }
                )
                l1 += k[1].length
                mf.forEach(dx => {
                    let objIndex2 = finalData[objIndex].children.findIndex((obj => obj.name === k[0]));
                    finalData[objIndex].children[objIndex2].children.push(
                        {
                            name: dx[0],
                            value: dx[1]
                        }
                    )
                })
            }
        })
        finalData[objIndex].length = l1;
        l1 = 0;
    })
    let sliceData = finalData.sort((a,b) => {return b.length - a.length}).slice(0,10)

    let data = {
            name: 'data',
            children: sliceData
        }
    return data;
}

// Data preparation for Map (Year with M/F count)
function prepareDataforStackedChart(data) {
    const resultColumns = [...new Set(data.map(d => d.Sex))];
    let displayData = Array.from( // get the Map.entries()
        d3.rollup(
            data,
            v => v.length,
            d => d.Year,
            d => d.Sex
        )
    ).sort().reduce((accumlator, [dateKey, innerMap]) => {
        let row = {Year: parseDate(dateKey)}
        resultColumns.map(col => row[col] = innerMap.has(col) ? innerMap.get(col) : 0);
        accumlator.push(row);
        return accumlator;
    }, []);

    return displayData

}

// brushing
eventHandler.bind("brushChanged", function(event){

    myMapVis.brushingChange(event.detail);
    myMapBarVis.brushingChange(event.detail);
});
function brushed() {
    let selectionRange = d3.brushSelection(d3.select(".brush").node());
    let selectionDomain = selectionRange.map(myBrushVis.x.invert);

    eventHandler.trigger("brushChanged", selectionDomain);
}
let clicks = 0;
let indexes = {0:9, 1:13,2:19};

function appendCircles() {

    let colours = ["rgba(183, 255, 191, 100%)", "rgba(228, 189, 236, 100%)", "rgba(255, 198, 90, 100%)"]

    if(clicks >= 0 && clicks < 3 ) {
        myBarVisOne.svg
            .append('g')
            .append('circle')
            .attr('r', 7)
            .style('fill', colours[clicks])
            .attr('stroke', 'black')
            .attr('stroke-width', 3)
            .attr('cx', myBarVisOne.x(myBarVisOne.displayData[1][indexes[clicks]].data.Year))
            .attr('cy', myBarVisOne.y(myBarVisOne.displayData[1][indexes[clicks]][1]))

        myBarVisOne.svg
            .append("text")
            .text(function(){
                if(clicks===0){
                    return "1932"
                }
                if(clicks===1){
                    return "1956"
                }
                if(clicks===2){
                    return "1980"
                }
            })
            .style('font-weight', 'bold')
            .attr("class", "city-label")
            .attr("x", myBarVisOne.x(myBarVisOne.displayData[1][indexes[clicks]].data.Year)-15)
            .attr("y", myBarVisOne.y(myBarVisOne.displayData[1][indexes[clicks]][1])-20);

        clicks += 1;

        let fact = "";

        if(clicks === 1){
            fact = "Olympic Games 1932 was held in Los Angeles, USA. This dip was caused by The Great Depression and many athletes were unable to afford the trip to the Olympics";
        }
        if(clicks === 2){
            fact = "Olympic Games 1956 was held in Melbourne, Australia. This dip was caused by some nations boycotts due to the Suez Crisis and Soviet invasion of Hungary.";
        }
        if(clicks === 3){
            fact = "Olympic Games 1980 was held in Moscow, Soviet Union. 66 nations boycotted this game due to the Soviet invasion of Afghanistan.";
        }

        let paragraph = document.createElement("p");
        paragraph.classList.add('box', 'new-box');

        paragraph.style.cssText = "padding-top: 10px; font-size: 16px"

        let node = document.createTextNode(fact);
        paragraph.appendChild(node);

        document.getElementById("facts").style.display = "block";

        let element = document.getElementById("facts");
        element.appendChild(paragraph);

        paragraph.style.backgroundColor = colours[clicks-1]

        if(clicks === 3){
            let del = document.getElementById("button-circles");
            del.style.cssText = "display: none";
        }
    }
}

function resetBrushing() {
    let displayData = prepareDataforStackedChart(raw_data[1])
    let min_year = d3.min(displayData, d => d.Year).getFullYear();
    let max_year = d3.max(displayData, d => d.Year).getFullYear();
    let resetSelection = []
    resetSelection[0] = parseDate(min_year);
    resetSelection[1] = parseDate(max_year);
    myBrushVis.svg.selectAll('.selection')
        .attr('x','0')
        .attr('width','0')
        .style('display','none');
    eventHandler.trigger("brushChanged", resetSelection);
}

function loadMedal() {
    //myMapVis.updateVis();
    myBrushVis.updateVis();
    //myMapBarVis.updateVis()
}