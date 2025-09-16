// Data Collection Module for HHLC Experiment
// Implements hybrid approach: Formspree + Download + localStorage backup

export class DataCollector {
    constructor() {
        // Replace with your actual Formspree endpoint
        this.formspreeEndpoint = 'https://formspree.io/f/YOUR_FORM_ID';
        this.backupMethods = [];
    }

    async submitParticipantData(data) {
        console.log('Starting data submission with hybrid approach...');
        const results = [];
        
        // Method 1: Try Formspree submission
        try {
            const formspreeSuccess = await this.submitToFormspree(data);
            if (formspreeSuccess) {
                results.push('✅ Online submission successful');
            } else {
                results.push('❌ Online submission failed');
            }
        } catch (error) {
            console.error('Formspree submission error:', error);
            results.push('❌ Online submission error');
        }

        // Method 2: Always download as JSON backup (same format as your current data folder)
        try {
            this.downloadAsJSON(data);
            results.push('✅ JSON file downloaded');
        } catch (error) {
            console.error('Download failed:', error);
            results.push('❌ Download failed');
        }

        // Method 3: Store in localStorage as emergency backup
        try {
            this.saveToLocalStorage(data);
            results.push('✅ Browser backup saved');
        } catch (error) {
            console.error('LocalStorage failed:', error);
            results.push('❌ Browser backup failed');
        }

        return results;
    }

    async submitToFormspree(data) {
        // Don't submit if no endpoint configured
        if (this.formspreeEndpoint.includes('YOUR_FORM_ID')) {
            console.log('Formspree not configured, skipping online submission');
            return false;
        }

        try {
            const response = await fetch(this.formspreeEndpoint, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sessionId: data.sessionId,
                    participantData: JSON.stringify(data, null, 2), // Full data as JSON string
                    timestamp: new Date().toISOString(),
                    studyType: '8_chart_hhlc_experiment'
                })
            });

            return response.ok;
        } catch (error) {
            console.error('Formspree submission failed:', error);
            return false;
        }
    }

    downloadAsJSON(data) {
        // Create exact same structure as your current data/participant_*.json files
        const participantData = {
            demographic: {
                age: data.demographic?.age || '',
                education: data.demographic?.education || '',
                profession: data.demographic?.profession || '',
                visualization: data.demographic?.visualization || '',
                visualizationBackground: data.demographic?.visualizationBackground || '',
                visualImpairment: data.demographic?.visualImpairment || '',
                chartFamiliarity: {
                    barCharts: data.demographic?.chartFamiliarity?.barCharts || '',
                    lineCharts: data.demographic?.chartFamiliarity?.lineCharts || '',
                    scatterplots: data.demographic?.chartFamiliarity?.scatterplots || '',
                    geographicalMaps: data.demographic?.chartFamiliarity?.geographicalMaps || ''
                }
            },
            responses: data.responses || [],
            sessionId: data.sessionId,
            selectedCharts: data.selectedCharts || [],
            chartCategories: data.chartCategories || {},
            completedAt: new Date().toISOString(),
            totalTimeMinutes: data.totalTimeMinutes || 0
        };

        // Create and download the file
        const blob = new Blob([JSON.stringify(participantData, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `participant_${data.sessionId}.json`;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log(`Downloaded: participant_${data.sessionId}.json`);
    }

    saveToLocalStorage(data) {
        const storageKey = `hhlc_participant_${data.sessionId}`;
        localStorage.setItem(storageKey, JSON.stringify(data));
        localStorage.setItem('hhlc_latest_session', data.sessionId);
        console.log(`Saved to localStorage: ${storageKey}`);
    }

    // Method to retrieve data from localStorage if needed
    getFromLocalStorage(sessionId) {
        const storageKey = `hhlc_participant_${sessionId}`;
        const data = localStorage.getItem(storageKey);
        return data ? JSON.parse(data) : null;
    }

    // Method to get all stored sessions
    getAllStoredSessions() {
        const sessions = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('hhlc_participant_')) {
                const sessionId = key.replace('hhlc_participant_', '');
                sessions.push(sessionId);
            }
        }
        return sessions;
    }

    // Method to configure Formspree endpoint
    setFormspreeEndpoint(endpoint) {
        this.formspreeEndpoint = endpoint;
    }

    // Method to show completion message with results
    showCompletionMessage(results, sessionId) {
        const successCount = results.filter(r => r.startsWith('✅')).length;
        const totalMethods = results.length;
        
        const message = `
            <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #28a745;">✅ Thank You for Participating!</h2>
                <p style="font-size: 18px; margin: 20px 0;">Your data has been saved successfully!</p>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">Data Submission Status:</h3>
                    <ul style="text-align: left; display: inline-block;">
                        ${results.map(result => `<li style="margin: 5px 0;">${result}</li>`).join('')}
                    </ul>
                </div>
                
                <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Study ID:</strong> <code>${sessionId}</code></p>
                    <p style="font-size: 14px; color: #666;">
                        Please save this ID for your records. If you downloaded a file, 
                        please keep it safe as a backup of your participation.
                    </p>
                </div>
                
                <p style="color: #666; font-size: 14px;">
                    Questions about this study? Contact: researcher@email.com
                </p>
            </div>
        `;
        
        document.body.innerHTML = message;
    }
}

// Create and export a singleton instance
export const dataCollector = new DataCollector();

// For debugging - expose to window in development
if (import.meta.env.DEV) {
    window.dataCollector = dataCollector;
}