# Study Data Structure Documentation

## Complete JSON Structure After All Changes

The final participant JSON file will now include the following structure:

```json
{
  "participantId": "participant_1736912345678_abc123def",
  "sessionId": "sess_xyz789",
  "timestamp": 1736912345678,
  "studyStartTime": 1736912300000,
  "studyDuration": 45678,
  
  // Demographic Information
  "demographics": {
    "age": "25",
    "profession": "Computer Science / Software Development",
    "education": "Master's degree",
    "visualization": "4",
    "visualizationBackground": "Moderate exposure",
    "mediaVisualizationExposure": "Regularly",
    "mediaVisualizationHelpfulness": "4",
    "visualImpairment": "No",
    "chartFamiliarity": {
      "barCharts": "5",
      "lineCharts": "4",
      "scatterplots": "3",
      "geographicalMaps": "2"
    }
  },
  
  // Main Study Responses (8 charts)
  "responses": [
    {
      "chartId": 15,
      "chartIndex": 1,
      "chartCategory": "Bar Charts (1-5)",
      "understanding": "This bar chart shows sales data across different quarters...",
      "factors": "",
      "lasso": [
        {"x": 0.234, "y": 0.456},
        {"x": 0.345, "y": 0.567},
        // ... simplified polygon coordinates (max 40 vertices)
      ],
      "lassoSummary": {
        "bbox": {"minX": 0.234, "minY": 0.456, "maxX": 0.789, "maxY": 0.890},
        "centroid": {"x": 0.512, "y": 0.673},
        "area": 0.0234
      },
      "difficultyScale": 2
    }
    // ... 15 more chart responses
  ],
  
  // Post-Study Information
  "postStudy": {
    "recognizedCharts": [15, 23, 31], // Chart IDs that participant recognized
    "feedback": "The study was well designed. The lasso tool was intuitive...",
    "completedAt": "2025-01-15T10:30:45.678Z"
  },
  
  // Chart Selection and Categories
  "selectedCharts": [15, 23, 31, 7, 12, 18, 25, 33, 4, 9, 14, 20, 28, 35, 2, 11],
  "chartCategories": {
    "15": "Bar Charts (1-5)",
    "23": "Bar Charts (1-5)",
    // ... mapping for all 8 charts
  },
  
  // Timing Information
  "mainStudyCompletedAt": "2025-01-15T10:25:30.123Z",
  "totalTimeMinutes": 23,
  "mainStudyCompletionTime": 1736912330123,
  "studyCompleteTimestamp": 1736912345678,
  
  // VL Test Information
  "vlTestSelfReportedScore": {
    "overallScore": 9,
    "maxScore": 12,
    "percentage": 75
  },
  
  // Data Quality Flags
  "dataQualityFlags": {
    "suspiciousText": false,
    "gibberishResponses": false,
    "tooShortResponses": false,
    "rapidCompletion": false
  }
}
```

## Key Improvements

1. **Lasso Data Optimization**: Each lasso now contains simplified coordinates (max 40 vertices) and summary statistics
2. **Post-Study Data**: Chart recognition and feedback are captured
3. **Complete Demographics**: Including the new media visualization helpfulness question
4. **Data Quality**: Automated quality flags for suspicious responses
5. **Comprehensive Timing**: Multiple timestamps for different study phases

## Data Reduction

- **Before**: Lasso coordinates could contain 200+ vertices per chart (3200+ total coordinates)
- **After**: Maximum 40 vertices per chart (640 total coordinates) + summary statistics
- **Space Savings**: ~80% reduction in coordinate data while maintaining accuracy
