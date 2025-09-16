# HHLC Experiment - Vite Deployment Setup

## Quick Start

### 1. Development
```bash
npm run dev
```
This starts the development server at http://localhost:3000

### 2. Build for Production
```bash
npm run build
```
This creates optimized files in the `dist/` folder for deployment.

### 3. Preview Production Build
```bash
npm run preview
```
This serves the built files locally for testing.

## Data Collection Setup

### Option 1: Formspree (Recommended)
1. Sign up at [formspree.io](https://formspree.io)
2. Create a new form
3. Copy your form endpoint (e.g., `https://formspree.io/f/xpzkgqrd`)
4. Update the endpoint in `src/dataCollector.js`:

```javascript
this.formspreeEndpoint = 'https://formspree.io/f/YOUR_FORM_ID';
```

### Option 2: Download Only
If you prefer participants to only download their data:
1. Set the endpoint to a dummy value
2. The system will automatically skip online submission and only download files

## Deployment to GitHub Pages

### Method 1: GitHub Actions (Automated)
1. Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ 8_chart ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    - name: Install dependencies
      run: npm install
    - name: Build
      run: npm run build
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

2. Push to the `8_chart` branch
3. GitHub will automatically build and deploy

### Method 2: Manual
1. Run `npm run build`
2. Upload contents of `dist/` folder to `gh-pages` branch

## File Structure

```
├── index.html              # Main entry point
├── src/
│   ├── main.js             # Main experiment logic
│   ├── dataCollector.js    # Hybrid data collection
│   ├── studyIntegration.js # Integration with existing pages
│   └── styles.css          # Styles
├── public/                 # Static assets (charts, other HTML pages)
├── dist/                   # Built files (created by npm run build)
├── vite.config.js          # Vite configuration
└── package.json            # Dependencies and scripts
```

## Data Collection Features

### ✅ Multiple Backup Methods
- **Primary**: Online submission via Formspree
- **Backup**: Automatic JSON download
- **Emergency**: Browser localStorage

### ✅ Same Data Format
The hybrid system preserves your exact data structure:
```json
{
  "demographic": { /* same as before */ },
  "responses": [ /* same as before */ ],
  "sessionId": "session_...",
  "selectedCharts": [1, 5, 11, ...],
  "chartCategories": { /* same as before */ },
  "completedAt": "2025-01-15T...",
  "totalTimeMinutes": 23
}
```

### ✅ Participant Experience
- Immediate confirmation of data saving
- Download provides tangible backup
- No data loss possible

## Integration with Existing Pages

Your existing HTML pages in `public/` continue to work. To add hybrid data collection to any page:

```html
<!-- Add to any existing study page -->
<script type="module">
  import './src/studyIntegration.js';
  
  // Optional: Configure Formspree
  setFormspreeEndpoint('https://formspree.io/f/YOUR_FORM_ID');
</script>
```

## Testing

1. **Development**: Use `npm run dev` and test all functionality
2. **Build Test**: Run `npm run build && npm run preview`
3. **Data Collection**: Test with dummy data to ensure downloads work
4. **Formspree**: Test online submission if configured

## Configuration Options

### Vite Config (`vite.config.js`)
- Update `base` URL for your GitHub repository
- Modify build output settings

### Data Collector (`src/dataCollector.js`)
- Change Formspree endpoint
- Modify completion message
- Adjust backup strategies

## Troubleshooting

### Build Fails
- Check that all imports use correct paths
- Ensure `src/main.js` exists

### Data Not Submitting
- Check Formspree endpoint configuration
- Verify browser console for errors
- Test download fallback

### GitHub Pages Not Working
- Ensure `base` URL in `vite.config.js` matches repository name
- Check that `dist/` folder is properly deployed

## Support
For questions about this setup, check the browser console for error messages and refer to:
- [Vite Documentation](https://vitejs.dev)
- [Formspree Documentation](https://help.formspree.io)