$(function () {
	var variable_dict = {
		"binned_ages": function(d) { return d.AGEBIN},
		"binned_ages_by_gender": function(d) { return d.AGEBIN + " " + d.SEX },
		"birthplaces": function(d) { return d.BPL },
		"language": function(d) { return d.LANG },
		"married_by_gender": function(d) { return d.MARST + " " + d.SEX },
		"own_v_rent": function(d) { return d.HOMEOWN }
	}

	var variable_heightScale_dict = {
		"binned_ages": function(d, heightScale) { return heightScale(d.AGEBIN)},
		"binned_ages_by_gender": function(d, heightScale) { return heightScale(d.AGEBIN + " " + d.SEX) },
		"birthplaces": function(d, heightScale) { return heightScale(d.BPL) },
		"language": function(d, heightScale) { return heightScale(d.LANG) },
		"married_by_gender": function(d, heightScale) { return heightScale(d.MARST + " " + d.SEX) },
		"own_v_rent": function(d, heightScale) { return heightScale(d.HOMEOWN) }
	}
	function barCharting(dataset_name, chart_name) {
		d3.selectAll(".chart").selectAll("g").remove();
		margin = {top: 40, right: 20, bottom: 20, left: 120},
		padding = {top: 20, right: 20, bottom: 20, left: 20},
		outerWidth = 600,
		outerHeight = 350;
		if (dataset_name === "birthplaces") {
			outerHeight = 1400; 
		} else if (dataset_name === "language") {
			outerHeight = 800; 
		}
		innerWidth = outerWidth - margin.left - margin.right,
		innerHeight = outerHeight - margin.top - margin.bottom,
		width = innerWidth - padding.left - padding.right,
		height = innerHeight - padding.top - padding.bottom;

		var widthScale = d3.scale.linear()
			.range([ 0, width ]);

		var heightScale = d3.scale.ordinal()
			.rangeRoundBands([ 0, height ], 0.1);

		percent_formatter = d3.format(".0%");

		var xAxis = d3.svg.axis()
			.scale(widthScale)
			.tickFormat(percent_formatter)
			.orient("bottom");

		var yAxis = d3.svg.axis()
			.scale(heightScale)
			.orient("left");
		var chart = d3.select(".chart")
			.attr("width", outerWidth)
			.attr("height", outerHeight)
			.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
		var chartg = chart.append("g");

		function update(year, json) {
			var json_year = $.grep(json, function(obj) { return obj["YEAR"] === year });
			var total_count = 0;
			for (var i = 0; i < json_year.length; i++) {
				total_count += json_year[i].count;
			}
			for (var i = 0; i < json_year.length; i++) {
				json_year[i].percent_count = json_year[i].count / total_count;
			}
			

			chart.selectAll(".chart-name").remove();
			chart.append("text")
				.attr("x", (outerWidth / 2) - margin.left)
				.style("text-anchor", "middle")
				.classed("chart-name", true)
				.attr("y", 20 - margin.top)
				.text(chart_name + " in " + year);
			
			bar = chartg.selectAll("g")
				.data(json_year, variable_dict[dataset_name]);


			// Update old ones
			bar.select("rect")
				.transition()
				.duration(750)
				.attr("x", padding[3])
				.attr("y", function(d) {
					return variable_heightScale_dict[dataset_name](d, heightScale);
				})
				.attr("width", function(d) {
					return widthScale(d.percent_count);
				})
				.attr("height", heightScale.rangeBand())
				.attr("fill", "steelblue")
				.select("title")
				.text(function(d) {
					return variable_dict[dataset_name](d) + ": " + (d.percent_count * 100).toFixed(2) + "%";
				});

			// Enter new ones
			bar.enter().append("g")
				.append("rect")
				.attr("x", padding[3])
				.attr("y", function(d) {
					return variable_heightScale_dict[dataset_name](d, heightScale);
				})
				.attr("width", function(d) {
					return widthScale(d.percent_count);
				})
				.attr("height", heightScale.rangeBand())
				.attr("fill", "steelblue")
				.append("title")
				.text(function(d) {
					return variable_dict[dataset_name](d) + ": " + (d.percent_count * 100).toFixed(2) + "%";
				});

			bar.exit().remove();

		}
		
		d3.json("/assets/js/nicollet-island/data/" + dataset_name + ".json", function(error, json) {
			if (error) { return console.warn(error); }
			widthScale.domain([ 0, d3.max(json, function(d) {
				return 1;
			})*1.05 ]);

			var json_1940 = $.grep(json, function(obj) { return obj["YEAR"] === "1940" });

			heightScale.domain(json_1940.map(variable_dict[dataset_name]));
			chart.append("g")
				.attr("class", "y axis")
				.call(yAxis);

			chart.append("g")
				.attr("class", "x axis")
				.attr("transform", "translate(0," + height + ")")
				.call(xAxis);

			$(".chart_transition").removeClass("interactive_disabled").removeClass("interactive_selected");
			$.each(["1900", "1910", "1920", "1930", "1940"], function (idx, year) {
				var json_year = $.grep(json, function(obj) { return obj["YEAR"] === year });
				var chart_transition_year = $(".chart_transition[data-year='" + year + "']").off();
				if (json_year.length > 0) {
					chart_transition_year.click(function () {
						$(".chart_transition").removeClass("interactive_selected");
						chart_transition_year.addClass("interactive_selected");
						update(chart_transition_year.attr("data-year"), json);
						return false;
					});
				} else {
					chart_transition_year.addClass("interactive_disabled");
					chart_transition_year.click(function () {
						return false;
					});
				}
			});
			update("1940", json);
		});
	}
	barCharting("married_by_gender", $("#dataset_select option:selected").text());
	$("#dataset_select").change(function () {
		barCharting($(this).val(), $(this).find("option:selected").text());
	});
});
