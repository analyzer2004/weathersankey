// https://github.com/analyzer2004/weathersankey
// Copyright 2020 Eric Lo
class WeatherChart {
    constructor(parent) {
        this._parent = parent;
        this._width = 1024;
        this._height = 768;
        this._leftMargin = 20;

        this._margin = {
            sankeyTop: 60,
            sankeyBottom: 25,
            temp: 15
        };
        this._iconSize = 50;

        this._tempHeight = 100;        

        this._nodes = null;
        this._links = null;
        this._data = null;
        this._sort = 0; // 0: none, 1: clear to rain, 2: rain to clear
        this._unit = "°F";

        this._highColor = "#ef476f";
        this._lowColor = "#457b9d";
        this._conditions = null;

        this._column = {
            date: "date",
            high: "high",
            low: "low",
            condition: "condition"
        };
    }

    size(width, height) {
        this._width = width;
        this._height = height;
        return this;
    }

    icon(icon) {
        this._conditions = [
            { id: "Clear", index: 0, color: "#fff3b0", icon: icon.clear },
            { id: "Partially cloudy", index: 1, color: "#e7d8c9", icon: icon.cloudy },
            { id: "Overcast", color: "#ddd", index: 2, icon: icon.overcast },
            { id: "Rain", color: "#98c1d9", index: 3, icon: icon.rain },
            { id: "Snow", color: "#c2dfe3", index: 4, icon: icon.snow }
        ];
        return this;
    }

    column(column) {
        this._column = column;
        return this;
    }

    sort(sort) {
        this._sort = sort;
        return this;
    }

    unit(unit) {
        this._unit = unit;
        return this;
    }
  
    tempChartHeight(height) {
      this._tempHeight = height;
      return this;
    }

    render(data) {
        this._init();        
        this._process(data);
        this._drawSankey();
        this._drawTempChart();
        return this;
    }
  
    _init() {
      this._margin.sankeyTop = this._height / 650 * 60;
      this._iconSize = this._width / 1024 * 50;
    }

    _process(data) {
        const converted = data.map(d => {
            const date = d[this._column.date];
            var cond = d[this._column.condition];
            cond = (cond.startsWith("Rain") ? "Rain" : cond.startsWith("Snow") ? "Snow" : cond)            
            return {
                date: date,
                day: new Date(date).getDate(),
                high: d[this._column.high],
                low: d[this._column.low],
                condition: cond,
                color: this._lookup(cond).color,
                value: 1
            };
        });

        const ls = converted.map(d => ({ source: d.condition, target: d.date, value: 1 }));
        const conds = Array.from(new Set(converted.map(d => this._lookup(d.condition))));
        if (this._sort === 1) // clear to rain
            conds.sort((a, b) => a.index - b.index);
        else if (this._sort === 2) // rain to clear
            conds.sort((a, b) => b.index - a.index);
        const ns = conds.concat(converted.map(d => ({ id: d.date, color: d.color })));

        const { nodes, links } = this._sankey(ns, ls);
        this._nodes = nodes;
        this._links = links;
        this._data = converted;

        return this;
    }

    _drawTempChart() {
        var that = this;

        const x = d3.scalePoint()
            .domain(this._data.map(d => d.date))
            .range([this._leftMargin, this._width]);

        const y = d3.scaleLinear()
            .domain(d3.extent(this._data.flatMap(d => [d.high, d.low])).reverse())
            .range([0, this._tempHeight]);

        const top = this._height - this._tempHeight - this._margin.temp;
        const g = this._parent.append("g")
            .attr("opacity", 0.7)
            .attr("transform", `translate(0,${top})`)
            .call(g => g.append("rect")
                .attr("width", this._width).attr("height", this._tempHeight)
                .attr("opacity", 1).attr("fill", "white"))
            .datum(this._data)
            .call(g => drawLine(g, this._highColor, d => d.high))
            .call(g => drawLine(g, this._lowColor, d => d.low));

        const axis = g.append("g")
            .call(g => g.attr("transform", "translate(20, 0)")
                .call(d3.axisLeft(y).tickValues(y.domain()))
                .select(".domain").remove()
            );

        this._drawTempIndicator(g);

        function drawLine(g, color, f) {
            g.append("path")
                .attr("fill", "none")
                .attr("stroke", color)
                .attr("stroke-width", 1.5)
                .attr("d", d => d3.line()
                    .x(d => x(d.date))
                    .y(d => y(f(d)))(d));
        }
    }

    _drawTempIndicator(g) {
        var that = this;

        const line = g.append("g")
            .attr("opacity", 0)
            .attr("font-size", "9pt")
            .attr("font-weight", "bold");

        line.append("line")
            .attr("stroke", "#999")
            .attr("x1", 0).attr("y1", 0)
            .attr("x2", 0).attr("y2", this._tempHeight);

        const high = line.append("text")
            .attr("fill", this._highColor)
            .attr("dy", "-1em")
            .attr("transform", `translate(5,${this._tempHeight})`);

        const low = line.append("text")
            .attr("fill", this._lowColor)
            .attr("transform", `translate(5,${this._tempHeight})`);

        g.on("mouseenter", () => line.attr("opacity", 1))
            .on("mousemove", (e, d) => moveTempLine(e, d))
            .on("mouseleave", () => {
                line.attr("opacity", 0);
                dates.attr("fill", "#999").attr("font-weight", "normal");
            });

        const days = this._nodes.filter(d => d.depth === 1);
        const dates = this._parent.selectAll(".date");
        function moveTempLine(e, d) {
            const
                converted = that._convertCoordinate(e, g),
                pos = converted.x;

            if (pos >= that._leftMargin) {
                const left = days[0].y0, right = days[days.length - 1].y1;
                const index = d3.bisect(
                    d3.range(left, right, days[1].y0 - days[0].y0),
                    pos - that._leftMargin
                );

                const weather = that._data[index - 1];
                high.text(`High: ${weather.high}${that._unit}`);
                low.text(`Low: ${weather.low}${that._unit}`);

                const hb = high.node().getBBox(),
                    lb = low.node().getBBox();
                const w = hb.width > lb.width ? hb.width : lb.width;
                const tx = pos + w > right ? -w : 5;
                high.attr("transform", `translate(${tx},${that._tempHeight})`);
                low.attr("transform", `translate(${tx},${that._tempHeight})`);

                line.attr("transform", `translate(${pos},0)`);
                dates
                    .attr("fill", (d, i) => i === index - 1 ? "black" : "#999")
                    .attr("font-weight", (d, i) => i === index - 1 ? "bold" : "normal");
            }
        }
        return line;
    }

    _drawSankey() {
        var that = this;      
        
        const g = this._parent.append("g")
            .attr("transform", `translate(${this._leftMargin},${this._margin.sankeyTop})`);

        const nodes = g.append("g")
            .selectAll("g")
            .data(this._nodes)
            .join("g")
            .attr("opacity", 1)
            .attr("fill", d => d.color)
            .attr("transform", d => `translate(${d.y0},${d.x0})`)
            .call(g => g.append("rect").attr("width", d => d.y1 - d.y0).attr("height", d => d.x1 - d.x0))
            .on("mouseover", (e, d) => highlight(e, d))
            .on("mouseout", (e, d) => restore(e, d, true));

        this._addCondition(nodes);
        this._addDate(nodes);

        const links = g.append("g")
            .attr("fill", "none")
            .selectAll("g")
            .data(this._links)
            .join("g")
            .append("path")
            .attr("stroke-opacity", 0.5)
            .attr("d", this._sankeyLinkVertical())
            .attr("stroke", d => d.source.color)
            .attr("stroke-width", d => Math.max(1, d.width));

        function highlight(e, d, restore) {
            links.filter(l => l.source !== d && l.target !== d)
                .transition().duration(500)
                .attr("stroke-opacity", restore ? 0.5 : 0.2);
            nodes.transition().duration(500)
                .attr("opacity", n => restore || linkedNodes(d).some(ln => n === ln) ? 1 : 0.2);
        }

        function restore(e, d) {
            highlight(e, d, true);
        }

        function linkedNodes(n) {
            return Array.from(new Set(that._links
                .flatMap(d => d.source === n || d.target === n ? [d.source, d.target] : null)
                .filter(d => d !== null)
            ));
        }
    }

    _addCondition(nodes) {        
        nodes.filter(d => d.depth === 0)
            .call(g => g.append("image")
                .attr("width", this._iconSize)
                .attr("height", this._iconSize)
                .attr("opacity", 0.4)
                .attr("href", d => this._lookup(d.id).icon)
                .attr("transform", `translate(5,-${this._margin.sankeyTop})`))
            .call(g => g.append("line")
                .attr("stroke", "#999")
                .attr("stroke-width", 0.5)
                .attr("stroke-dasharray", "3,3")
                .attr("x1", 1).attr("x2", 1)
                .attr("y1", 0).attr("y2", -this._margin.sankeyTop))
            .call(g => g.append("text")
                .attr("class", "days")
                .attr("fill", d => d3.color(d.color).darker(0.3))
                .attr("text-anchor", "end")
                .attr("transform", d => `translate(${d.y1 - d.y0}, -2)`)
                .text(d => d.value));
    }

    _addDate(nodes) {
        nodes.filter(d => d.depth === 1)
            .append("text")
            .attr("class", "date")
            .attr("fill", "#999")
            .attr("text-anchor", "middle")
            .attr("transform", d => `translate(${(d.y1 - d.y0) / 2},${this._margin.sankeyBottom})`)
            .text(d => (new Date(d.id)).getDate());
    }

    _sankey(nodes, links) {        
        const sankeyHeight = this._height - this._tempHeight - this._margin.sankeyTop - this._margin.sankeyBottom - this._margin.temp;
        return d3.sankey()
            .nodeId(d => d.id)
            .nodeWidth(10)
            .nodePadding(10)
            .nodeSort(null)
            .size([sankeyHeight, this._width - this._leftMargin])({            
                nodes: nodes.map(d => Object.assign({}, d)),
                links: links.map(d => Object.assign({}, d))
            });
    }

    _getNodeColor(d) {
        if (d.depth === 0)
            return this._lookup(d.id).color;
        else if (d.depth === 1) {
            const day = this._data.find(_ => _.date === d.id);
            if (day) return this._lookup(day.condition).color;
        }
    }

    _lookup(condId) {
        return this._conditions.find(d => d.id === condId);
    }

    _sankeyLinkVertical() {
        return d3.linkVertical()
            .source(verticalSource)
            .target(verticalTarget);

        function verticalSource(d) {
            return [d.y0, d.source.x1];
        }

        function verticalTarget(d) {
            return [d.y1, d.target.x0];
        }
    }

    // Utilities
    //
    _getSVG() {
        let curr = this._parent.node();
        while (curr && curr.tagName !== "svg")
            curr = curr.parentElement;
        return curr;
    }

    _convertCoordinate(e, g) {
        const svg = this._getSVG();
        if (svg) {
            // convert to SVG coordinates
            const p = svg.createSVGPoint()
            p.x = e.clientX;
            p.y = e.clientY;
            return p.matrixTransform(g.node().getScreenCTM().inverse());
        }
        else {
            throw "Unable to find SVG element";
        }
    }
}