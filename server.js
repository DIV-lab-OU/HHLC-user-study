const express = require('express');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
const app = express();
const PORT = 3000;

// In-memory storage for participant session data
const participantSessions = {};

// Session configuration
app.use(session({
    secret: 'hhlc-user-study-session-key-2025',
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: false, // Set to true if using HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

app.use(express.json());
app.use(express.static('public'));

// Session management endpoints
app.post('/api/init-session', (req, res) => {
    // Generate unique participant ID
    const participantId = `participant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Initialize session
    req.session.participantId = participantId;
    req.session.studyStartTime = Date.now();
    req.session.sessionInitialized = true;
    
    // Initialize participant session data
    participantSessions[participantId] = {
        sessionId: req.sessionID,
        startTime: Date.now(),
        vlTestScore: null,
        vlTestMaxScore: null,
        vlTestScoreTimestamp: null
    };
    
    res.json({ 
        success: true, 
        participantId: participantId,
        sessionId: req.sessionID
    });
});

app.get('/api/session-status', (req, res) => {
    res.json({
        sessionActive: !!req.session.sessionInitialized,
        participantId: req.session.participantId || null,
        studyStartTime: req.session.studyStartTime || null
    });
});

app.post('/api/clear-session', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Session destruction error:', err);
            return res.status(500).json({ success: false, error: 'Failed to clear session' });
        }
        res.json({ success: true });
    });
});

// Enhanced submission endpoint with session validation
app.post('/submit', (req, res) => {
    const data = req.body;
    const timestamp = Date.now();
    
    // Use session participant ID if available, otherwise generate one
    const participantId = req.session.participantId || `participant_${timestamp}`;
    const filename = `${participantId}.json`;
    const filepath = path.join(__dirname, 'data', filename);

    // Validate response quality
    const dataQualityFlags = validateResponseQuality(data);

    // Get self-reported VL test score from session
    const sessionVlScore = participantSessions[participantId]?.vlTestScore || null;
    const sessionVlMaxScore = participantSessions[participantId]?.vlTestMaxScore || null;
    
    // Enhanced data structure with session info and VL Test results
    const enhancedData = {
        ...data,
        participantId: participantId,
        sessionId: req.sessionID,
        timestamp: timestamp,
        studyStartTime: req.session.studyStartTime || timestamp,
        studyDuration: req.session.studyStartTime ? timestamp - req.session.studyStartTime : 0,
        vlTestSelfReportedScore: sessionVlScore !== null ? {
            overallScore: sessionVlScore,
            maxScore: sessionVlMaxScore || 12,
            percentage: sessionVlMaxScore ? Math.round((sessionVlScore / sessionVlMaxScore) * 100) : Math.round((sessionVlScore / 12) * 100)
        } : null,
        dataQualityFlags: dataQualityFlags
    };

    fs.writeFile(filepath, JSON.stringify(enhancedData, null, 2), err => {
        if (err) {
            console.error('Error writing file:', err);
            return res.status(500).json({ success: false });
        }
        
        // Clear session after successful submission
        req.session.destroy();
        
        res.json({ success: true, filename: filename, participantId: participantId });
    });
});

// VL Test progress tracking endpoint
app.post('/api/vl-test-progress', (req, res) => {
    try {
        const { participantId, testType, progress, completed } = req.body;
        const timestamp = Date.now();
        
        const progressLog = {
            timestamp: timestamp,
            participantId: participantId || 'unknown',
            testType: testType,
            progress: progress,
            completed: completed
        };
        
        const progressFile = path.join(__dirname, 'vl_test_progress.json');
        let progressData = [];
        
        if (fs.existsSync(progressFile)) {
            try {
                progressData = JSON.parse(fs.readFileSync(progressFile, 'utf8'));
            } catch (parseError) {
                console.error('Error parsing progress file:', parseError);
                progressData = [];
            }
        }
        
        progressData.push(progressLog);
        fs.writeFileSync(progressFile, JSON.stringify(progressData, null, 2));
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error logging VL test progress:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// VL Test scores submission endpoint
app.post('/api/vl-test-scores', (req, res) => {
    try {
        const { participantId, overallScore, maxScore, timestamp } = req.body;
        
        // Store score in participant's session data
        if (participantSessions[participantId]) {
            participantSessions[participantId].vlTestScore = overallScore;
            participantSessions[participantId].vlTestMaxScore = maxScore;
            participantSessions[participantId].vlTestScoreTimestamp = timestamp;
        }
        
        // Log score to a separate file for backup
        const scoreLog = {
            timestamp: timestamp,
            participantId: participantId || 'unknown',
            overallScore: overallScore,
            maxScore: maxScore,
            percentage: maxScore ? Math.round((overallScore / maxScore) * 100) : null
        };
        
        const scoresFile = path.join(__dirname, 'vl_test_scores.json');
        let scoresData = [];
        
        if (fs.existsSync(scoresFile)) {
            try {
                scoresData = JSON.parse(fs.readFileSync(scoresFile, 'utf8'));
            } catch (parseError) {
                console.error('Error parsing scores file:', parseError);
                scoresData = [];
            }
        }
        
        scoresData.push(scoreLog);
        fs.writeFileSync(scoresFile, JSON.stringify(scoresData, null, 2));
        
        console.log(`VL Test score received for participant ${participantId}: ${overallScore}/${maxScore}`);
        res.json({ success: true });
    } catch (error) {
        console.error('Error storing VL test score:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Data quality validation function
function validateResponseQuality(data) {
    const flags = {
        suspiciousText: false,
        gibberishResponses: false,
        tooShortResponses: false,
        rapidCompletion: false
    };
    
    // Check text responses for gibberish patterns
    if (data.responses && Array.isArray(data.responses)) {
        for (const response of data.responses) {
            const textFields = [response.understanding, response.factors, response.difficultyText].filter(Boolean);
            
            for (const text of textFields) {
                if (text && typeof text === 'string') {
                    // Check for gibberish patterns
                    const avgWordLength = text.split(' ').reduce((sum, word) => sum + word.length, 0) / text.split(' ').length;
                    const hasSpaces = text.includes(' ');
                    const isVeryShort = text.length < 5;
                    
                    if (!hasSpaces && text.length > 3) {
                        flags.gibberishResponses = true;
                    }
                    if (avgWordLength > 12 && !hasSpaces) {
                        flags.suspiciousText = true;
                    }
                    if (isVeryShort) {
                        flags.tooShortResponses = true;
                    }
                }
            }
        }
    }
    
    // Check for suspiciously rapid completion
    if (data.studyDuration && data.studyDuration < 120000) { // Less than 2 minutes
        flags.rapidCompletion = true;
    }
    
    return flags;
}

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('VL Test framework integration enabled');
});
