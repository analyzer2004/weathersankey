# Weather Sankey

Using Sankey diagram to visualize historical weather data gives you a different aspect of statistics. Weather conditions are on the top, and the dates of the month are on the bottom. Each color represents a different weather condtion, it highlighs the corresponding dates as you hover over the conditions. The whole picture is simple yet very effective on showing how the conditions are distributed.

The line chart on the bottom represents the trend of daily temperatures. As you hover across the chart, a reference line will follow along with high/low temperatures appearing on the side.

[<img src="https://github.com/analyzer2004/weathersankey/blob/master/images/cover.png" width="960">]



<div style="font-size:10pt; font-style:italic">Icons made by <a href="https://www.flaticon.com/authors/bqlqn" title="bqlqn">bqlqn</a> from <a href="https://www.flaticon.com/" title="Flaticon"> www.flaticon.com</a></div>

# API Reference
* **WeatherChart(parent)** - Constructs a new weather chart generator with the default settings. The **parent** can be a SVG or any g.
* **size(width, height, xr)** - Sets this chart's dimensions to specified width and height and returns this chart. The xr is the specified width to Notebook's width ratio (it is only for Observable Notebook and is not needed outside of Observable).
* **icon(icon)** - Sets the icon for each weather condition and returns this chart.
  * icon.**clear** - the url of clear icon
  * icon.**cloudy** - the url of cloudy icon
  * icon.**overcast** - the url of overcast icon
  * icon.**rain** - the url of rain icon
  * icon.**snow** - the url of snow icon
* **column(column) ** - Sets the column names for parsing weather csv data and returns this chart.
  * column.**date** - the column name of date
  * column.**high** - the column name of the high daily temperature
  * column.**low** - the column name of the low daily temperature
  * column.**condition** - the column name of the daily weather condition
* **sort(sort) ** - Sets the sort order of the weather conditions and returns this chart.
  * **0** - none (default)
  * **1** - clear to rain
  * **2** - rain to clear
* **unit(unit) ** - Sets the unit of displayed temperature (default: °F) and returns this chart.
* **render(data) ** - Renders the visualization using specified **MONTHLY** weather data (with columns date, high, low temperatures and condition) and returns this chart.