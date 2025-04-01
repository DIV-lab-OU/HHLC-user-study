import os
import json
import random
import csv

# === CONFIG ===
data_folder = "data"
chart_folder = "charts"
os.makedirs(chart_folder, exist_ok=True)

# Load available data files
data_files = sorted([f for f in os.listdir(data_folder) if f.endswith(".json")])
if not data_files:
    raise Exception("No data files found in /data. Please add JSON files like 1_data.json")

tick_styles = [
    [0, 50, 100],
    [0, 25, 50, 75, 100],
    [0, 30, 60, 90]
]

titles = {
    "4_words": [
        "Company Revenue Over Years",
        "Stock Markets Through Decades",
        "Yearly Changing Precipitation Rates",
        "Average Growth in Car Sales",
        "Population Growth Through Years"
    ],
    "8_words": [
        "Company Revenue Analysis Growth^ from 2000 to 2020",
        "Stock Market Values Vary^ Significantly: 2000 to 2020",
        "Tracking Annual Precipitation Rates^ during 2000 to 2020",
        "Tracking Average Car Sales from^ 2000 to 2020",
        "Average Yearly Population Trends from 2000 to 2020"
    ],
    "12_words": [
        "Average Company Revenue from 2000 to 2020:^ Constant Trends Through the Years",
        "Consistent Tracking of Annual Stock Market Values:^ Insights in Current Stable Patterns",
        "Yearly Precipitation Patterns and Trends in^ Rainfall Across Regions between 2000 to 2020",
        "Average Car Sales in 2000-2020: An Increasing^ Consumer Demand and Economic Factors",
        "Understanding Population Growth Trends and^ Projecting Future Increases from 2000 to 2020"
    ]
}

patterns = ["upward", "downward", "peak/valley", "uniform", "irregular"]

def load_data_from_file(filename):
    with open(os.path.join(data_folder, filename)) as f:
        return json.load(f)

def make_spec(data, title, y_ticks, pattern):
    return {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "description": f"Pattern: {pattern}",
        "data": {
            "values": data
        },
        "mark": {"type": "line", "interpolate": "cardinal", "tension": 0.4},
        "encoding": {
            "x": {
                "field": "X", "type": "quantitative", "title": "",
                "axis": {
                    "grid": False,
                    "format": "d",
                    "values": [2000, 2005, 2010, 2015, 2020],
                    "tickSize": 4
                },
                "scale": {"domain": [2000, 2020]}
            },
            "y": {
                "field": "Y", "type": "quantitative", "title": "",
                "axis": {
                    "grid": False,
                    "format": "d",
                    "values": y_ticks,
                    "tickSize": 4,
                    "tickOpacity": 1
                },
                "scale": {"domain": [0, 100]}
            }
        },
        "title": {
            "text": title,
            "anchor": "middle",
            "font": "Tahoma",
            "fontSize": 12
        },
        "config": {
            "lineBreak": "^",
            "view": {"stroke": None}
        },
        "height": 400,
        "width": 400,
        "autosize": "pad"
    }

# Start generation
log_rows = []
chart_id = 1

for pattern in patterns:
    for title_type in ["4_words", "8_words", "12_words"]:
        used_titles = random.sample(titles[title_type], 3)
        tick_combos = tick_styles.copy()
        random.shuffle(tick_combos)

        for i in range(3):
            title = used_titles[i]
            y_ticks = tick_combos[i]

            # Pick a data file randomly or cycle through
            data_file = data_files[(chart_id - 1) % len(data_files)]
            data = load_data_from_file(data_file)

            # Build spec
            spec = make_spec(data, title, y_ticks, pattern)

            filename = f"{chart_id}_chart.json"
            path = os.path.join(chart_folder, filename)
            with open(path, "w") as f:
                json.dump(spec, f, indent=2)

            log_rows.append({
                "chart_id": chart_id,
                "pattern": pattern,
                "title": title,
                "title_length": int(title_type.split('_')[0]),
                "y_ticks": str(y_ticks),
                "data_file": data_file
            })

            print(f"✅ Generated {filename} using {data_file}")
            chart_id += 1

# Save CSV log
with open("chart_log.csv", "w", newline="") as csvfile:
    fieldnames = ["chart_id", "pattern", "title", "title_length", "y_ticks", "data_file"]
    writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(log_rows)

print("\n📄 chart_log.csv saved.")
