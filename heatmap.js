 var selecter = d3.select("#ZipCodeSelecter")
                        .attr('class', 'select')
                        .on('change', updateZipCode);    

    var margin = {top: 100, right: 190, bottom: 30, left: 50},
        width = 900 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    var parseDate = d3.time.format("%m").parse,
        formatDate = d3.time.format("%b");

    var x = d3.time.scale().range([0, width]),
        y = d3.scale.linear().range([height, 0]),
        z = d3.scale.linear().range(["#fee0d2", "#e2160f"]);

    // The size of the buckets in the CSV data file.
    // This could be inferred from the data if it weren't sparse.
    var xStep = 1,
        yStep = 1;

    var svg = d3.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    var started = false;
    var selectedZipCode = 90077;
    function updateZipCode() {
        if (started) selectedZipCode = +selecter.property('value');

        d3.csv("heatmap.csv", function(error, buckets) {
            if (error) throw error;
            
            // Coerce the CSV data to the appropriate types.
            buckets.forEach(function(d) {
                d.nMonth = +d.Month;
                d.Month = parseDate(d.Month);    
                d.Year = +d.Year;
                d.Power = +d.Power;
                d.ZipCode = +d['Zip Code'];
            });

            if (!started) selecter
                            .selectAll('option')
                            .data(d3.map(buckets, function(d){return d.ZipCode;}).keys())
                            .enter()
                            .append("option")
                            .text(function(d){return d;})

            
            // Compute the scale domains.
            x.domain(d3.extent(buckets, function(d) { return d.nMonth; }));
            y.domain(d3.extent(buckets, function(d) { return d.Year; }));
            z.domain(d3.extent(buckets, function(d) { if (d.ZipCode === selectedZipCode) return d.Power; }));

            // Extend the x- and y-domain to fit the last bucket.
            // For example, the y-bucket 3200 corresponds to values [3200, 3300].
            //x.domain([x.domain()[0], +x.domain()[1] + xStep]);
            //y.domain([y.domain()[0], y.domain()[1] + yStep]);

            // Display the tiles for each non-zero bucket.
            // See http://bl.ocks.org/3074470 for an alternative implementation.
            var tileWidth = x(xStep) - x(0);
            var tileHeight = y(0) - y(yStep);
            var tileMargin = 5;

            svg.selectAll('g').remove();
            var tiles = svg.append('g')
                            .attr('class','tiles')
                            .selectAll(".tile")
                            .data(buckets);

            tiles.enter().append("rect")
                .filter(function(d) { return d.ZipCode === selectedZipCode; })
                .attr("class", "tile")
                .attr("x", function(d) { return x(d.nMonth) + (tileMargin/2); })
                .attr("y", function(d) { return y(d.Year + yStep) + (tileMargin/2); })
                .attr("width", tileWidth - tileMargin)
                .attr("height", tileHeight - tileMargin)
                .style("fill", function(d) { return z(d.Power); });

            

            // Add a legend for the color values.
            var legendGroup = svg.append('g').attr('class','legendGroup');
            var legend = legendGroup.selectAll(".legend")
                .data(z.ticks(7).reverse())
                .enter().append("g")
                .attr("class", "legend")
                .attr("transform", function(d, i) { return "translate(" + (width + 100) + "," + (i * 25) + ")"; });

            legend.append("rect")
                .attr("width", 20)
                .attr("height", 20)
                .style("fill", z);

            legend.append("text")
                .attr("x", 26)
                .attr("y", 10)
                .attr("dy", ".35em")
                .text(String);

            legendGroup.append("text")
                .attr('transform', "translate(" + (width + 113) + ",-10)")
                .attr("class", "label")
                .text("kWh");

            // Add an x-axis with label.
            x.domain(d3.extent(buckets, function(d) { return d.Month; }));
            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(" + (tileWidth/2) + "," + height + ")")
                .call(d3.svg.axis().scale(x).ticks(d3.time.months).tickFormat(formatDate).orient("bottom"))
                .append("text")
                .attr("class", "label")
                .attr("x", width + tileWidth + 5)
                .attr("y", 13)
                .attr("text-anchor", "end")
                .text("Month");

            // Add a y-axis with label.
            svg.append("g")
                .attr("class", "y axis")
                .call(d3.svg.axis().scale(y).tickFormat(function(d){return d;}).orient("left"))
                .attr("transform", "translate(0," + -(tileHeight/2) + ")")
                .append("text")
                .attr("class", "label")
                .attr("y", -25)
                .attr("dy", ".71em")
                .attr("text-anchor", "end")
                .text("Year");
            
            started = true;
        });        
    }
    
    updateZipCode();

