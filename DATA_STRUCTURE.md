# HHLC User Study - Data Structure

## Sample Participant Data Output

```json
{
  "demographic": {
    "age": "25",
    "education": "Master's degree",
    "profession": "Data Science / Analytics",
    "visualization": "4",
    "visualizationBackground": "Frequent user of visual data",
    "visualImpairment": "No",
    "chartFamiliarity": {
      "barCharts": "4",
      "lineCharts": "5",
      "scatterplots": "3",
      "geographicalMaps": "2"
    }
  },
  "responses": [
    {
      "chartId": 23,
      "chartIndex": 1,
      "chartCategory": "Single-class Bar Graphs",
      "understanding": "The graph shows an upward trend over time with some fluctuations. It appears to represent growth in some metric, possibly sales or population, with periods of steady increase and occasional dips.",
      "factors": "The overall upward slope of the line is the main factor driving my understanding. Also, the y-axis scale and the time progression on the x-axis help me see the trend. The color and thickness of the line make it easy to follow.",
      "difficultyScale": 2,
      "difficultyText": "It was fairly easy to interpret because the trend is clear and the axes are well labeled."
    },
    {
      "chartId": 7,
      "chartIndex": 2,
      "chartCategory": "Multi-class Scatterplots",
      "understanding": "This graph shows a more complex pattern with multiple peaks and valleys. It seems to represent cyclical data with periods of growth followed by decline.",
      "factors": "The multiple turning points and the cyclical nature of the data. The grid lines help me track the values, and the overall pattern suggests seasonal or periodic behavior.",
      "difficultyScale": 4,
      "difficultyText": "More challenging because of the multiple direction changes and trying to understand the underlying pattern."
    }
    // ... continues for all 8 charts
  ],
  "sessionId": "session_1753987123456",
  "selectedCharts": [23, 7, 15, 18, 2, 42, 29, 33],
  "chartCategories": {
    "23": "Single-class Bar Graphs",
    "7": "Multi-class Scatterplots", 
    "15": "Single-class Line Charts",
    "18": "Multi-class Line Charts",
    "2": "Single-class Scatterplots",
    "42": "Multi-class Maps",
    "29": "Multi-class Bar Graphs",
    "33": "Single-class Maps"
  },
  "completedAt": "2025-08-04T10:30:45.123Z",
  "totalTimeMinutes": 18
}
```

## Data Fields Explanation

### Demographic Data
- **age**: Participant's age (18-65)
- **education**: Highest education level completed
- **profession**: Current profession from comprehensive list (50+ options)
- **visualization**: General familiarity with interpreting graphs and data visualizations (1-5 scale)
- **visualizationBackground**: Detailed experience level with data visualizations (6 categories from "No formal exposure" to "Expert")
- **visualImpairment**: Any visual impairments or color vision deficiencies affecting chart viewing
- **chartFamiliarity**: Specific familiarity ratings for each chart type
  - **barCharts**: Familiarity with bar charts (1-5 scale)
  - **lineCharts**: Familiarity with line charts (1-5 scale)
  - **scatterplots**: Familiarity with scatterplots (1-5 scale)
  - **geographicalMaps**: Familiarity with geographical maps (1-5 scale)

### Response Data (per chart)
- **chartId**: The actual chart number from the images folder (1-45)
- **chartIndex**: Display order for this participant (1-8)
- **chartCategory**: The visualization type category (e.g., "Single-class Scatterplots")
- **understanding**: Open-ended response to "What can you understand from the graph given?"
- **factors**: Open-ended response to "What factors/features drive your understanding?"
- **difficultyScale**: Numeric rating 1-5 (1=Very Easy, 5=Very Difficult)
- **difficultyText**: Optional elaboration on difficulty level

### Session Metadata
- **sessionId**: Unique identifier for this study session
- **selectedCharts**: Array of the 8 randomly selected chart IDs
- **completedAt**: ISO timestamp when study was completed
- **totalTimeMinutes**: Total time spent on the study (if available)

## Chart Selection Logic
- **Stratified Random Sampling**: Each participant gets exactly one chart from each of the 8 categories
- **Randomization**: 
  1. One chart is randomly selected from each category (ensuring balanced representation)
  2. The 8 selected charts are then shuffled to randomize presentation order
  3. Each session gets a unique combination while maintaining category balance
- **Chart Categories** (40 total charts):
  1. Single-class Scatterplots: Charts 1-5 (5 charts)
  2. Multi-class Scatterplots: Charts 6-10 (5 charts)
  3. Single-class Line Charts: Charts 11-15 (5 charts)
  4. Multi-class Line Charts: Charts 16-20 (5 charts)
  5. Single-class Bar Graphs: Charts 21-25 (5 charts)
  6. Multi-class Bar Graphs: Charts 26-30 (5 charts)
  7. Single-class Maps: Charts 31-35 (5 charts)
  8. Multi-class Maps: Charts 36-40 (5 charts)
- **Example**: Participant A might get [3, 7, 13, 18, 22, 28, 34, 41] → shuffled to [22, 3, 41, 7, 13, 34, 18, 28]
- **Guarantee**: Every participant sees exactly one chart from each visualization type, but the specific charts and order are randomized
- Charts are referenced by their filename number (1_chart.png = chartId 1)

## Validation Rules
- All demographic fields are required (age, education, profession, visualization familiarity, background, visual impairment)
- All chart familiarity ratings are required (bar charts, line charts, scatterplots, geographical maps)
- Understanding and factors questions require text responses
- Difficulty scale requires selection (1-5)
- Difficulty text is optional

## Visualization Background Categories
1. **No formal exposure** - No training or regular encounters with data visualizations
2. **Basic exposure** - Occasional viewing in media/reports without deep interpretation
3. **Moderate exposure** - Regular interaction with Excel charts, dashboards as part of work/study
4. **Trained in basic data visualization** - At least one course/workshop on reading or designing visualizations
5. **Frequent user of visual data** - Regular analysis/creation in academic, professional, or research contexts
6. **Expert / Professional visualization designer or analyst** - Designs complex visualizations or teaches others
