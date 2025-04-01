import os
import json
import vl_convert as vlc

# Paths
input_folder = "charts"
output_folder = "images"
os.makedirs(output_folder, exist_ok=True)

# Loop through each JSON spec
for filename in sorted(os.listdir(input_folder)):
    if filename.endswith("_chart.json"):
        chart_id = filename.split("_")[0]
        json_path = os.path.join(input_folder, filename)
        output_path = os.path.join(output_folder, f"{chart_id}_chart.png")

        # Load JSON spec
        with open(json_path, "r") as f:
            spec = json.load(f)

        # Convert Vega-Lite spec to PNG using vl-convert-python
        try:
            png_data = vlc.vegalite_to_png(spec)
            with open(output_path, "wb") as out_file:
                out_file.write(png_data)
            print(f"✅ Saved: {output_path}")
        except Exception as e:
            print(f"⚠️ Failed: {filename} — {e}")
