var w = 400
var h = 400
var name1 = {};
var name2 = {};
var name3 = {};

tip = d3.tip()
  .attr('class', 'd3-tip')
  .offset([-10, 0])
  .html(function(d) {
    return "<strong>Creator "+name1[d]+" :</strong> <span style='color:red'> "+ d + "</span>";
  })


function bars(data,name)
{

    max = d3.max(data)
var formatPercent = d3.format("s");

    //nice breakdown of d3 scales
    //http://www.jeromecukier.net/blog/2011/08/11/d3-scales-and-color/
    x = d3.scale.linear()
        .domain([0, max])
        .range([0, w])

    y = d3.scale.ordinal()
        .domain(d3.range(data.length))
        .rangeBands([0, h], .2)

        var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom")
    .tickFormat(formatPercent);



    var vis = d3.select("#barchart")
    
    //a good written tutorial of d3 selections coming from protovis
    //http://www.jeromecukier.net/blog/2011/08/09/d3-adding-stuff-and-oh-understanding-selections/
    var bars = vis.selectAll("rect.bar")
        .data(data)


    //update
    bars
        .attr("fill", "#0a0")
        .attr("stroke", "#050")

    //enter
    bars.enter()
        .append("svg:rect")
        .attr("class", "bar")
        .attr("x", function(d) { return x(name[d]); })
        .attr("fill", "#800")
        .attr("stroke", "#800")
          .on('mouseover', tip.show)
      .on('mouseout', tip.hide);


    //exit 
    bars.exit()
    .transition()
    .duration(300)
    .ease("exp")
        .attr("width", 0)
        .remove()


    bars
        .attr("stroke-width", 4)
    .transition()
    .duration(300)
    .ease("quad")
        .attr("width", x)
        .attr("height", y.rangeBand())
        .attr("transform", function(d,i) {
            return "translate(" + [0, y(i)] + ")"
        })


}


function init()
{





    //setup the svg


 



    var svg = d3.select("#svg")
        .attr("width", w+100)
        .attr("height", h+100)

            svg.call(tip);
    svg.append("svg:rect")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("stroke", "#000")
        .attr("fill", "none")
          






    svg.append("svg:g")
        .attr("id", "barchart")
        .attr("transform", "translate(50,50)")
    
    //setup our ui
    d3.select("#data1")
        .on("click", function(d,i) {
            bars(data1,name1)
        })   
    d3.select("#data2")
        .on("click", function(d,i) {
            bars(data2,name2)
        })   
    d3.select("#data3")
        .on("click", function(d,i) {
            bars(data3,name3)
        });   


 var parseQueryString = function() {

    var str = window.location.search;
    var objURL = {};

    str.replace(
        new RegExp( "([^?=&]+)(=([^&]*))?", "g" ),
        function( $0, $1, $2, $3 ){
            objURL[ $1 ] = $3;
        }
    );
    return objURL;
};
var csvFile = parseQueryString()["data"]+".csv";
var data1 = [];
var data2 = [];
var data3 = [];

d3.csv(csvFile, function(error, data) {

  error.forEach(function(d) {
    if(!isNaN(d.streamlength)){
    data1.push(d.streamlength );
    name1[d.streamlength]=d.name;
    data2.push(""+d.streamlength/60);
        name1[d.streamlength/60]=d.name;

    data3.push(""+d.streamlength/3600);
        name1[d.streamlength/3600]=d.name;
}
  });

    bars(data1,name1)

});
    //make the bars
}