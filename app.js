/* ChronoSync - Application Logic Engine */

document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. DOM Elements & State Variables
    // ==========================================
    
    // Tab Elements
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');
    const pageTitle = document.getElementById('page-title');
    let activeTab = 'stopwatch';
    
    // Theme & Audio Config
    const themeSelector = document.getElementById('theme-selector');
    const btnSound = document.getElementById('btn-sound');
    const soundOnIcon = btnSound.querySelector('.sound-on-icon');
    const soundOffIcon = btnSound.querySelector('.sound-off-icon');
    let soundEnabled = true;

    const btnTick = document.getElementById('btn-tick');
    const tickOnIcon = btnTick.querySelector('.tick-on-icon');
    const tickOffIcon = btnTick.querySelector('.tick-off-icon');
    let tickEnabled = false;

    let audioCtx = null;
    let activeAlarmInterval = null; // For recurring alert beep

    // Stopwatch State
    let swRunning = false;
    let swStartTime = 0;
    let swElapsedTime = 0; // accumulated time
    let swRequestID = null;
    let laps = [];
    let lastSwSecTick = -1;
    const stopwatchDisplay = document.getElementById('stopwatch-display');
    const stopwatchRing = document.getElementById('stopwatch-ring');
    const btnStart = document.getElementById('btn-start');
    const startBtnText = document.getElementById('start-btn-text');
    const playIcon = btnStart.querySelector('.play-icon');
    const pauseIcon = btnStart.querySelector('.pause-icon');
    const btnLap = document.getElementById('btn-lap');
    const btnReset = document.getElementById('btn-reset');
    
    // Timer State
    let timerRunning = false;
    let timerDuration = 0; // ms
    let timerTimeRemaining = 0; // ms
    let timerStartTime = 0;
    let timerInterval = null;
    let lastTimerSecTick = -1;
    const timerRing = document.getElementById('timer-ring');
    const timerDisplay = document.getElementById('timer-display');
    const timerPickerUI = document.getElementById('timer-picker-ui');
    const timerHoursInput = document.getElementById('timer-hours');
    const timerMinutesInput = document.getElementById('timer-minutes');
    const timerSecondsInput = document.getElementById('timer-seconds');
    const btnTimerStart = document.getElementById('btn-timer-start');
    const timerStartBtnText = document.getElementById('timer-start-btn-text');
    const btnTimerCancel = document.getElementById('btn-timer-cancel');
    const presetBtns = document.querySelectorAll('.preset-btn');
    
    // Clock & Alarm State
    const clockTime = document.getElementById('clock-time');
    const clockDate = document.getElementById('clock-date');
    const alarmForm = document.getElementById('alarm-form');
    const alarmTimeInput = document.getElementById('alarm-time');
    const alarmLabelInput = document.getElementById('alarm-label');
    const alarmList = document.getElementById('alarm-list');
    let alarms = [];
    
    // Analytics & Charts Elements
    const metricAvg = document.getElementById('metric-avg');
    const metricFastest = document.getElementById('metric-fastest');
    const metricSlowest = document.getElementById('metric-slowest');
    const metricTotal = document.getElementById('metric-total');
    const lapTableBody = document.getElementById('lap-table-body');
    const chartSvg = document.getElementById('analytics-chart');
    const btnExport = document.getElementById('btn-export');
    const btnClearLaps = document.getElementById('btn-clear-laps');

    // Dialog Overlay
    const alarmAlert = document.getElementById('alarm-alert');
    const alarmAlertText = document.getElementById('alarm-alert-text');
    const btnAlarmDismiss = document.getElementById('btn-alarm-dismiss');

    // Circular Dashboard Constants (Ring Circumference)
    // 2 * PI * r = 2 * 3.14159 * 130 = 816.8
    const ringCircumference = 816.8;

    // ==========================================
    // 2. Synthesized Sound Effects (Web Audio API)
    // ==========================================

    function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    function playSound(type, extraVal) {
        if (!soundEnabled) return;
        try {
            initAudio();
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            const now = audioCtx.currentTime;
            
            if (type === 'click') {
                // Short retro click
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.exponentialRampToValueAtTime(300, now + 0.08);
                gainNode.gain.setValueAtTime(0.08, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                osc.start(now);
                osc.stop(now + 0.08);
            } else if (type === 'lap') {
                // High bell chime
                osc.type = 'sine';
                osc.frequency.setValueAtTime(1200, now);
                osc.frequency.exponentialRampToValueAtTime(600, now + 0.2);
                gainNode.gain.setValueAtTime(0.12, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
            } else if (type === 'reset') {
                // Descending whoosh beep
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.exponentialRampToValueAtTime(100, now + 0.25);
                gainNode.gain.setValueAtTime(0.1, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
                osc.start(now);
                osc.stop(now + 0.25);
            } else if (type === 'tick') {
                // Metronome second ticks (extraVal is true for Tock, false for Tick)
                const freq = extraVal ? 350 : 450;
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now);
                gainNode.gain.setValueAtTime(0.015, now); // very quiet
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
                osc.start(now);
                osc.stop(now + 0.015);
            } else if (type === 'record') {
                // Triumphant arpeggio melody (C5, E5, G5, C6)
                const notes = [523.25, 659.25, 783.99, 1046.50];
                notes.forEach((freq, idx) => {
                    const o = audioCtx.createOscillator();
                    const g = audioCtx.createGain();
                    o.type = 'triangle';
                    o.frequency.setValueAtTime(freq, now + idx * 0.07);
                    o.connect(g);
                    g.connect(audioCtx.destination);
                    g.gain.setValueAtTime(0.08, now + idx * 0.07);
                    g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.12);
                    o.start(now + idx * 0.07);
                    o.stop(now + idx * 0.07 + 0.12);
                });
            } else if (type === 'alarm-beep') {
                // Rich alarm ringing chime (dual alternate tones)
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(587.33, now); // D5
                osc.frequency.setValueAtTime(659.25, now + 0.12); // E5
                gainNode.gain.setValueAtTime(0.12, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
                osc.start(now);
                osc.stop(now + 0.35);
                
                // Harmonizer oscillator
                const osc2 = audioCtx.createOscillator();
                const gain2 = audioCtx.createGain();
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(880, now); // A5
                osc2.connect(gain2);
                gain2.connect(audioCtx.destination);
                gain2.gain.setValueAtTime(0.04, now);
                gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                osc2.start(now);
                osc2.stop(now + 0.3);
            }
        } catch (e) {
            console.error('Audio synthesis failed:', e);
        }
    }

    // Toggle Sound settings
    btnSound.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        if (soundEnabled) {
            soundOnIcon.classList.remove('hidden');
            soundOffIcon.classList.add('hidden');
            playSound('click');
        } else {
            soundOnIcon.classList.add('hidden');
            soundOffIcon.classList.remove('hidden');
        }
    });

    // Toggle Ticks settings
    btnTick.addEventListener('click', () => {
        tickEnabled = !tickEnabled;
        if (tickEnabled) {
            tickOnIcon.classList.remove('hidden');
            tickOffIcon.classList.add('hidden');
            playSound('click');
        } else {
            tickOnIcon.classList.add('hidden');
            tickOffIcon.classList.remove('hidden');
        }
    });

    // ==========================================
    // 3. Tab Navigation & Page Routing
    // ==========================================
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            playSound('click');
            const tabName = item.getAttribute('data-tab');
            
            navItems.forEach(n => n.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            item.classList.add('active');
            const currentTabContent = document.getElementById(`${tabName}-view`);
            if (currentTabContent) {
                currentTabContent.classList.add('active');
            }
            
            activeTab = tabName;
            
            // Format page title header
            switch(tabName) {
                case 'stopwatch':
                    pageTitle.innerText = "Stopwatch";
                    break;
                case 'timer':
                    pageTitle.innerText = "Countdown Timer";
                    break;
                case 'clock':
                    pageTitle.innerText = "Clock & Alarms";
                    break;
            }
        });
    });

    // ==========================================
    // 4. Stopwatch Functionality
    // ==========================================

    function formatTime(ms) {
        let hours = Math.floor(ms / 3600000);
        let minutes = Math.floor((ms % 3600000) / 60000);
        let seconds = Math.floor((ms % 60000) / 1000);
        let milliseconds = Math.floor(ms % 1000);
        
        let hh = String(hours).padStart(2, '0');
        let mm = String(minutes).padStart(2, '0');
        let ss = String(seconds).padStart(2, '0');
        let mmm = String(milliseconds).padStart(3, '0');
        
        return {
            formattedStr: `${hh}:${mm}:${ss}`,
            msStr: `.${mmm}`,
            rawStr: `${hh}:${mm}:${ss}.${mmm}`
        };
    }

    function updateStopwatchUI() {
        const timePassed = performance.now() - swStartTime + swElapsedTime;
        const timeObj = formatTime(timePassed);
        
        stopwatchDisplay.innerHTML = `<span class="time-main">${timeObj.formattedStr}</span><span class="time-ms">${timeObj.msStr}</span>`;
        
        // Metronome second ticks
        const currentSec = Math.floor(timePassed / 1000);
        if (tickEnabled && currentSec !== lastSwSecTick) {
            playSound('tick', currentSec % 2 === 0);
            lastSwSecTick = currentSec;
        }
        
        // Ring animation (tracks seconds progress, one rotation every 60 seconds)
        const secondsProgress = (timePassed % 60000) / 60000;
        const strokeOffset = ringCircumference * (1 - secondsProgress);
        stopwatchRing.style.strokeDashoffset = strokeOffset;
        
        swRequestID = requestAnimationFrame(updateStopwatchUI);
    }

    function swStart() {
        swRunning = true;
        swStartTime = performance.now();
        btnStart.classList.add('btn-secondary');
        btnStart.classList.remove('btn-primary');
        startBtnText.innerText = "Pause";
        playIcon.classList.add('hidden');
        pauseIcon.classList.remove('hidden');
        
        stopwatchDisplay.classList.add('running');
        
        btnLap.disabled = false;
        btnReset.disabled = true;
        
        updateStopwatchUI();
    }

    function swPause() {
        swRunning = false;
        cancelAnimationFrame(swRequestID);
        swElapsedTime += performance.now() - swStartTime;
        
        btnStart.classList.add('btn-primary');
        btnStart.classList.remove('btn-secondary');
        startBtnText.innerText = "Resume";
        playIcon.classList.remove('hidden');
        pauseIcon.classList.add('hidden');
        
        stopwatchDisplay.classList.remove('running');
        
        btnLap.disabled = true;
        btnReset.disabled = false;
    }

    function swReset() {
        swRunning = false;
        cancelAnimationFrame(swRequestID);
        swElapsedTime = 0;
        lastSwSecTick = -1;
        
        stopwatchDisplay.innerHTML = `<span class="time-main">00:00:00</span><span class="time-ms">.000</span>`;
        stopwatchRing.style.strokeDashoffset = ringCircumference;
        
        btnStart.classList.add('btn-primary');
        btnStart.classList.remove('btn-secondary');
        startBtnText.innerText = "Start";
        playIcon.classList.remove('hidden');
        pauseIcon.classList.add('hidden');
        
        stopwatchDisplay.classList.remove('running');
        
        btnLap.disabled = true;
        btnReset.disabled = true;
    }

    btnStart.addEventListener('click', () => {
        playSound('click');
        if (swRunning) {
            swPause();
        } else {
            swStart();
        }
    });

    btnReset.addEventListener('click', () => {
        playSound('reset');
        swReset();
    });

    btnLap.addEventListener('click', () => {
        const currentTime = swRunning ? (performance.now() - swStartTime + swElapsedTime) : swElapsedTime;
        
        let splitTime = currentTime;
        if (laps.length > 0) {
            splitTime = currentTime - laps[0].overallTimeVal; // Relative split
        }
        
        // Check if this split beats the fastest lap record (if there are previous laps)
        let isFastestRecord = false;
        if (laps.length > 0) {
            const minSplit = Math.min(...laps.map(l => l.splitTimeVal));
            if (splitTime < minSplit) {
                isFastestRecord = true;
            }
        }
        
        if (isFastestRecord) {
            playSound('record');
        } else {
            playSound('lap');
        }
        
        const lapNum = laps.length + 1;
        laps.unshift({
            lapNum: lapNum,
            splitTimeVal: splitTime,
            overallTimeVal: currentTime
        });
        
        renderLaps();
        updateAnalytics();
        drawLapChart();
    });

    // ==========================================
    // 5. Lap & Analytics Engine
    // ==========================================

    function renderLaps() {
        if (laps.length === 0) {
            lapTableBody.innerHTML = `<tr><td colspan="4" class="no-data-msg">No splits recorded yet.</td></tr>`;
            btnExport.disabled = true;
            btnClearLaps.disabled = true;
            return;
        }

        btnExport.disabled = false;
        btnClearLaps.disabled = false;

        // Determine fastest and slowest splits
        let fastestIdx = -1;
        let slowestIdx = -1;
        let minSplit = Infinity;
        let maxSplit = -Infinity;

        laps.forEach((lap, index) => {
            if (lap.splitTimeVal < minSplit) {
                minSplit = lap.splitTimeVal;
                fastestIdx = index;
            }
            if (lap.splitTimeVal > maxSplit) {
                maxSplit = lap.splitTimeVal;
                slowestIdx = index;
            }
        });

        // If only 1 lap exists, don't mark it as slowest/fastest simultaneously
        if (laps.length === 1) {
            fastestIdx = -1;
            slowestIdx = -1;
        }

        lapTableBody.innerHTML = '';
        
        laps.forEach((lap, index) => {
            const splitFormatted = formatTime(lap.splitTimeVal).rawStr;
            const overallFormatted = formatTime(lap.overallTimeVal).rawStr;
            
            // Calculate delta with previous lap split
            let deltaStr = '--';
            let deltaClass = '';
            
            if (index < laps.length - 1) {
                // Remember laps array is unshifted, so index + 1 is the older lap
                const prevLap = laps[index + 1];
                const deltaVal = lap.splitTimeVal - prevLap.splitTimeVal;
                const deltaSign = deltaVal > 0 ? '+' : '';
                deltaStr = `${deltaSign}${(deltaVal / 1000).toFixed(2)}s`;
                deltaClass = deltaVal > 0 ? 'delta-positive' : 'delta-negative';
            }

            const tr = document.createElement('tr');
            if (index === fastestIdx) tr.classList.add('lap-fastest');
            if (index === slowestIdx) tr.classList.add('lap-slowest');
            
            tr.innerHTML = `
                <td class="font-mono">#${lap.lapNum}</td>
                <td class="font-mono">${splitFormatted}</td>
                <td class="font-mono">${overallFormatted}</td>
                <td class="font-mono ${deltaClass}">${deltaStr}</td>
            `;
            lapTableBody.appendChild(tr);
        });
    }

    function updateAnalytics() {
        if (laps.length === 0) {
            metricAvg.innerText = '--:--.--';
            metricFastest.innerText = '--:--.--';
            metricSlowest.innerText = '--:--.--';
            metricTotal.innerText = '0';
            return;
        }

        let totalSplit = 0;
        let minSplit = Infinity;
        let maxSplit = -Infinity;

        laps.forEach(lap => {
            totalSplit += lap.splitTimeVal;
            if (lap.splitTimeVal < minSplit) minSplit = lap.splitTimeVal;
            if (lap.splitTimeVal > maxSplit) maxSplit = lap.splitTimeVal;
        });

        const avgSplit = totalSplit / laps.length;
        
        metricAvg.innerText = formatTime(avgSplit).formattedStr + formatTime(avgSplit).msStr.substring(0, 3);
        metricFastest.innerText = formatTime(minSplit).formattedStr + formatTime(minSplit).msStr.substring(0, 3);
        metricSlowest.innerText = formatTime(maxSplit).formattedStr + formatTime(maxSplit).msStr.substring(0, 3);
        metricTotal.innerText = laps.length;
    }

    btnClearLaps.addEventListener('click', () => {
        playSound('reset');
        laps = [];
        renderLaps();
        updateAnalytics();
        drawLapChart();
    });

    btnExport.addEventListener('click', () => {
        if (laps.length === 0) return;
        playSound('click');
        
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Lap,Split Time (ms),Overall Time (ms),Split Time (Formatted),Overall Time (Formatted)\n";
        
        // Need to loop in chronological order for export
        const exportLaps = [...laps].reverse();
        exportLaps.forEach(l => {
            csvContent += `${l.lapNum},${l.splitTimeVal},${l.overallTimeVal},${formatTime(l.splitTimeVal).rawStr},${formatTime(l.overallTimeVal).rawStr}\n`;
        });
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `chronosync_laps_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // ==========================================
    // 6. Interactive SVG Lap Chart Renderer
    // ==========================================

    function drawLapChart() {
        // Clear SVG first
        chartSvg.innerHTML = '';
        
        if (laps.length < 2) {
            // Need at least 2 laps to draw a chart line
            chartSvg.innerHTML = `<text x="225" y="75" text-anchor="middle" fill="rgba(255,255,255,0.3)" font-size="12">Record 2 or more laps to draw trend lines</text>`;
            return;
        }

        // Chronological order for chart
        const chartData = [...laps].reverse();
        const totalPoints = chartData.length;
        
        // Find boundaries
        const splits = chartData.map(l => l.splitTimeVal / 1000); // in seconds
        const minVal = Math.min(...splits);
        const maxVal = Math.max(...splits);
        const range = maxVal - minVal;
        
        // Margins and scale bounds inside SVG (viewBox 450x150)
        const width = 450;
        const height = 150;
        const paddingLeft = 35;
        const paddingRight = 20;
        const paddingTop = 25;
        const paddingBottom = 25;
        
        const chartWidth = width - paddingLeft - paddingRight;
        const chartHeight = height - paddingTop - paddingBottom;
        
        // Helper scales
        function getX(index) {
            return paddingLeft + (index / (totalPoints - 1)) * chartWidth;
        }
        
        function getY(val) {
            if (range === 0) return paddingTop + chartHeight / 2; // Flat line
            // Invert Y since SVG y increases downward
            return paddingTop + chartHeight - ((val - minVal) / range) * chartHeight;
        }

        // 1. Draw Grid Lines and Y-Axis Labels
        const gridCount = 3;
        for (let i = 0; i <= gridCount; i++) {
            const fraction = i / gridCount;
            const gridVal = minVal + fraction * range;
            const yPos = getY(gridVal);
            
            // Grid line
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', paddingLeft);
            line.setAttribute('y1', yPos);
            line.setAttribute('x2', width - paddingRight);
            line.setAttribute('y2', yPos);
            line.setAttribute('class', 'chart-grid-line');
            chartSvg.appendChild(line);
            
            // Text Label
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', paddingLeft - 8);
            text.setAttribute('y', yPos + 3);
            text.setAttribute('text-anchor', 'end');
            text.setAttribute('class', 'chart-label');
            text.textContent = gridVal.toFixed(1) + 's';
            chartSvg.appendChild(text);
        }

        // 2. Generate SVG Gradient definition
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const linearGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        linearGradient.setAttribute('id', 'chart-gradient');
        linearGradient.setAttribute('x1', '0%');
        linearGradient.setAttribute('y1', '0%');
        linearGradient.setAttribute('x2', '0%');
        linearGradient.setAttribute('y2', '100%');
        
        const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop1.setAttribute('offset', '0%');
        stop1.setAttribute('stop-color', 'var(--accent-color)');
        stop1.setAttribute('stop-opacity', '0.25');
        
        const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop2.setAttribute('offset', '100%');
        stop2.setAttribute('stop-color', 'var(--accent-color)');
        stop2.setAttribute('stop-opacity', '0.0');
        
        linearGradient.appendChild(stop1);
        linearGradient.appendChild(stop2);
        defs.appendChild(linearGradient);
        chartSvg.appendChild(defs);

        // 3. Compute points and path
        let pointsArr = [];
        for (let i = 0; i < totalPoints; i++) {
            pointsArr.push(`${getX(i)},${getY(splits[i])}`);
        }
        const pointsStr = pointsArr.join(' ');

        // Draw Area Fill path
        const areaPathStr = `M ${getX(0)},${paddingTop + chartHeight} ` +
                           `L ${pointsArr.join(' L ')} ` +
                           `L ${getX(totalPoints - 1)},${paddingTop + chartHeight} Z`;
                           
        const area = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        area.setAttribute('d', areaPathStr);
        area.setAttribute('class', 'chart-area');
        chartSvg.appendChild(area);

        // Draw Line path
        const linePath = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
        linePath.setAttribute('points', pointsStr);
        linePath.setAttribute('class', 'chart-line');
        // Setup dash animation
        const totalLength = chartWidth * 1.5; // Approximation
        linePath.style.strokeDasharray = totalLength;
        linePath.style.strokeDashoffset = totalLength;
        chartSvg.appendChild(linePath);

        // 4. Draw Markers (Dots) on coordinates
        for (let i = 0; i < totalPoints; i++) {
            const x = getX(i);
            const y = getY(splits[i]);
            
            const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            dot.setAttribute('cx', x);
            dot.setAttribute('cy', y);
            dot.setAttribute('r', '4');
            dot.setAttribute('class', 'chart-dot');
            
            // Interactive tooltip/hover
            const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
            title.textContent = `Lap #${chartData[i].lapNum}: ${splits[i].toFixed(3)}s`;
            dot.appendChild(title);
            
            chartSvg.appendChild(dot);
            
            // X-Axis text marker
            if (totalPoints <= 8 || i === 0 || i === totalPoints - 1 || i === Math.floor(totalPoints / 2)) {
                const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                label.setAttribute('x', x);
                label.setAttribute('y', height - 5);
                label.setAttribute('text-anchor', 'middle');
                label.setAttribute('class', 'chart-label');
                label.textContent = `#${chartData[i].lapNum}`;
                chartSvg.appendChild(label);
            }
        }
    }

    // ==========================================
    // 7. Countdown Timer Functionality
    // ==========================================

    function getTimerTargetTime() {
        const h = parseInt(timerHoursInput.value) || 0;
        const m = parseInt(timerMinutesInput.value) || 0;
        const s = parseInt(timerSecondsInput.value) || 0;
        return (h * 3600 + m * 60 + s) * 1000;
    }

    function formatTimerDisplay(ms) {
        let totalSeconds = Math.ceil(ms / 1000);
        let hours = Math.floor(totalSeconds / 3600);
        let minutes = Math.floor((totalSeconds % 3600) / 60);
        let seconds = totalSeconds % 60;
        
        let hh = String(hours).padStart(2, '0');
        let mm = String(minutes).padStart(2, '0');
        let ss = String(seconds).padStart(2, '0');
        
        return `${hh}:${mm}:${ss}`;
    }

    function updateTimerUI() {
        const now = performance.now();
        const elapsed = now - timerStartTime;
        timerTimeRemaining = Math.max(0, timerDuration - elapsed);
        
        // Print text
        timerDisplay.innerText = formatTimerDisplay(timerTimeRemaining);
        
        // Metronome second ticks
        const currentSec = Math.floor(timerTimeRemaining / 1000);
        if (tickEnabled && currentSec !== lastTimerSecTick && timerTimeRemaining > 0) {
            playSound('tick', currentSec % 2 === 0);
            lastTimerSecTick = currentSec;
        }
        
        // Radial progress calculations
        const progressFraction = timerDuration > 0 ? (timerTimeRemaining / timerDuration) : 0;
        const offset = ringCircumference * (1 - progressFraction);
        timerRing.style.strokeDashoffset = offset;

        // Apply warning styles if remaining time is less than 10 seconds
        if (timerTimeRemaining <= 10000 && timerTimeRemaining > 0) {
            timerRing.classList.add('alarm-active-ring');
        } else {
            timerRing.classList.remove('alarm-active-ring');
        }
        
        if (timerTimeRemaining <= 0) {
            timerFinishedAlert();
        }
    }

    function timerStart() {
        timerDuration = getTimerTargetTime();
        if (timerDuration <= 0) return; // Prevent zero start
        
        timerRunning = true;
        timerStartTime = performance.now();
        
        // Hide Pickers, show digit display
        timerPickerUI.classList.add('hidden');
        timerDisplay.classList.remove('hidden');
        timerDisplay.classList.add('running');
        
        // Setup Control states
        btnTimerCancel.disabled = false;
        timerStartBtnText.innerText = "Pause";
        btnTimerStart.querySelector('.play-icon').classList.add('hidden');
        btnTimerStart.querySelector('.pause-icon').classList.remove('hidden');
        btnTimerStart.classList.add('btn-secondary');
        btnTimerStart.classList.remove('btn-primary');

        presetBtns.forEach(b => b.disabled = true);
        
        updateTimerUI();
        timerInterval = setInterval(updateTimerUI, 100);
    }

    function timerPause() {
        timerRunning = false;
        clearInterval(timerInterval);
        const elapsed = performance.now() - timerStartTime;
        timerDuration = Math.max(0, timerDuration - elapsed);
        
        timerStartBtnText.innerText = "Resume";
        btnTimerStart.querySelector('.play-icon').classList.remove('hidden');
        btnTimerStart.querySelector('.pause-icon').classList.add('hidden');
        btnTimerStart.classList.add('btn-primary');
        btnTimerStart.classList.remove('btn-secondary');
        
        timerDisplay.classList.remove('running');
    }

    function timerCancel() {
        timerRunning = false;
        clearInterval(timerInterval);
        timerDuration = 0;
        timerTimeRemaining = 0;
        lastTimerSecTick = -1;
        
        // Return to picker modes
        timerPickerUI.classList.remove('hidden');
        timerDisplay.classList.add('hidden');
        timerDisplay.classList.remove('running');
        
        // Reset dials and buttons
        timerRing.style.strokeDashoffset = 0;
        timerRing.classList.remove('alarm-active-ring');
        
        btnTimerCancel.disabled = true;
        timerStartBtnText.innerText = "Start";
        btnTimerStart.querySelector('.play-icon').classList.remove('hidden');
        btnTimerStart.querySelector('.pause-icon').classList.add('hidden');
        btnTimerStart.classList.add('btn-primary');
        btnTimerStart.classList.remove('btn-secondary');

        presetBtns.forEach(b => b.disabled = false);
    }

    function timerFinishedAlert() {
        timerCancel();
        
        // Show dialog alert overlay and flash screen border
        alarmAlertText.innerText = "Your countdown timer has reached zero.";
        alarmAlert.classList.remove('hidden');
        document.body.classList.add('alarm-active');
        
        // Play recurring alarm beeper
        playSound('alarm-beep');
        activeAlarmInterval = setInterval(() => {
            playSound('alarm-beep');
        }, 1200);
    }

    btnTimerStart.addEventListener('click', () => {
        playSound('click');
        if (timerRunning) {
            timerPause();
        } else {
            // Validate pickers
            let h = parseInt(timerHoursInput.value) || 0;
            let m = parseInt(timerMinutesInput.value) || 0;
            let s = parseInt(timerSecondsInput.value) || 0;
            
            // Auto overflow adjustment (e.g. 90 seconds becomes 1 min 30 sec)
            if (s >= 60) {
                m += Math.floor(s / 60);
                s = s % 60;
            }
            if (m >= 60) {
                h += Math.floor(m / 60);
                m = m % 60;
            }
            
            timerHoursInput.value = String(h).padStart(2, '0');
            timerMinutesInput.value = String(m).padStart(2, '0');
            timerSecondsInput.value = String(s).padStart(2, '0');
            
            if (getTimerTargetTime() > 0) {
                timerStart();
            }
        }
    });

    btnTimerCancel.addEventListener('click', () => {
        playSound('reset');
        timerCancel();
    });

    // Preset button trigger handlers
    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            playSound('click');
            const targetSeconds = parseInt(btn.getAttribute('data-time'));
            
            const hours = Math.floor(targetSeconds / 3600);
            const minutes = Math.floor((targetSeconds % 3600) / 60);
            const seconds = targetSeconds % 60;
            
            timerHoursInput.value = String(hours).padStart(2, '0');
            timerMinutesInput.value = String(minutes).padStart(2, '0');
            timerSecondsInput.value = String(seconds).padStart(2, '0');
        });
    });

    // Dismiss Alarm Overlay
    btnAlarmDismiss.addEventListener('click', () => {
        if (activeAlarmInterval) {
            clearInterval(activeAlarmInterval);
            activeAlarmInterval = null;
        }
        alarmAlert.classList.add('hidden');
        document.body.classList.remove('alarm-active');
        playSound('click');
    });

    // Keep pickers bounded between 0-99/0-59 on blur
    [timerHoursInput, timerMinutesInput, timerSecondsInput].forEach(inp => {
        inp.addEventListener('blur', () => {
            let val = Math.max(0, parseInt(inp.value) || 0);
            if (inp.id === 'timer-hours') {
                val = Math.min(99, val);
            } else {
                val = Math.min(59, val);
            }
            inp.value = String(val).padStart(2, '0');
        });
    });

    // ==========================================
    // 8. World Clock & Alarm Engine
    // ==========================================

    function updateClock() {
        const now = new Date();
        
        // 1. Render Clock text
        let hours = now.getHours();
        let minutes = String(now.getMinutes()).padStart(2, '0');
        let seconds = String(now.getSeconds()).padStart(2, '0');
        let ampm = hours >= 12 ? 'PM' : 'AM';
        
        hours = hours % 12;
        hours = hours ? hours : 12; // dynamic 12hr conversion
        let hh = String(hours).padStart(2, '0');
        
        clockTime.innerText = `${hh}:${minutes}:${seconds} ${ampm}`;
        
        // Render Date long format
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        clockDate.innerText = now.toLocaleDateString('en-US', options);
        
        // 2. Check Alarms
        const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const currentSS = now.getSeconds();
        
        alarms.forEach(alarm => {
            // Trigger alarm at 00 seconds of the matching hour/min
            if (alarm.active && alarm.time === currentHHMM && currentSS === 0) {
                triggerAlarmAlert(alarm);
            }
        });
    }

    function triggerAlarmAlert(alarm) {
        alarmAlertText.innerText = `Alarm Alert: "${alarm.label || 'Wake Up!'}" at ${alarm.time}`;
        alarmAlert.classList.remove('hidden');
        document.body.classList.add('alarm-active');
        
        // Play sound chime loop
        playSound('alarm-beep');
        activeAlarmInterval = setInterval(() => {
            playSound('alarm-beep');
        }, 1200);
    }

    // Set clock interval loop
    setInterval(updateClock, 1000);
    updateClock(); // Initial instant tick

    function renderAlarms() {
        alarmList.innerHTML = '';
        
        if (alarms.length === 0) {
            alarmList.innerHTML = `<li class="no-alarms">No active alarms set.</li>`;
            return;
        }

        alarms.forEach(alarm => {
            // Convert 24hr string to 12hr for nice UI display
            const timeParts = alarm.time.split(':');
            let h = parseInt(timeParts[0]);
            const m = timeParts[1];
            const ampm = h >= 12 ? 'PM' : 'AM';
            h = h % 12;
            h = h ? h : 12;
            const time12 = `${String(h).padStart(2, '0')}:${m} ${ampm}`;

            const li = document.createElement('li');
            li.className = 'alarm-item';
            li.innerHTML = `
                <div class="alarm-item-info">
                    <span class="alarm-item-time font-mono">${time12}</span>
                    <span class="alarm-item-label">${alarm.label || 'Alarm'}</span>
                </div>
                <button class="alarm-item-delete" data-id="${alarm.id}" aria-label="Delete alarm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
            `;
            
            // Delete handler
            li.querySelector('.alarm-item-delete').addEventListener('click', (e) => {
                const targetId = parseInt(e.currentTarget.getAttribute('data-id'));
                deleteAlarm(targetId);
            });
            
            alarmList.appendChild(li);
        });
    }

    function addAlarm(timeStr, label) {
        const newAlarm = {
            id: Date.now(),
            time: timeStr,
            label: label.trim(),
            active: true
        };
        
        // Prevent duplicate alarms for exact same minutes
        const exists = alarms.some(a => a.time === timeStr);
        if (exists) {
            alert('An alarm for this time already exists!');
            return;
        }

        alarms.push(newAlarm);
        // Sort chronologically
        alarms.sort((a,b) => a.time.localeCompare(b.time));
        
        renderAlarms();
        saveAlarms();
    }

    function deleteAlarm(id) {
        playSound('reset');
        alarms = alarms.filter(a => a.id !== id);
        renderAlarms();
        saveAlarms();
    }

    // Persist alarms to localStorage
    function saveAlarms() {
        localStorage.setItem('chronosync_alarms', JSON.stringify(alarms));
    }

    function loadAlarms() {
        const stored = localStorage.getItem('chronosync_alarms');
        if (stored) {
            try {
                alarms = JSON.parse(stored);
                renderAlarms();
            } catch(e) {
                alarms = [];
            }
        }
    }

    alarmForm.addEventListener('submit', (e) => {
        e.preventDefault();
        playSound('click');
        const time = alarmTimeInput.value;
        const label = alarmLabelInput.value || 'Alarm';
        
        if (time) {
            addAlarm(time, label);
            alarmTimeInput.value = '';
            alarmLabelInput.value = '';
        }
    });

    // ==========================================
    // 9. Theme Manager
    // ==========================================

    themeSelector.addEventListener('change', (e) => {
        const chosenTheme = e.target.value;
        document.body.className = chosenTheme;
        localStorage.setItem('chronosync_theme', chosenTheme);
        playSound('click');
        
        // Redraw SVG chart to adapt grid colors/line glows to theme accent shifts
        setTimeout(drawLapChart, 100);
    });

    function loadTheme() {
        const savedTheme = localStorage.getItem('chronosync_theme');
        if (savedTheme) {
            document.body.className = savedTheme;
            themeSelector.value = savedTheme;
        }
    }

    // ==========================================
    // 10. Global Hotkeys / Keyboard Shortcuts
    // ==========================================

    document.addEventListener('keydown', (e) => {
        // Ignore key shortcut events if user is typing inside text or time inputs
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
            return;
        }

        const key = e.key.toLowerCase();
        
        if (key === ' ') {
            // Spacebar -> Start/Pause active display
            e.preventDefault(); // Prevent scrolling down page
            if (activeTab === 'stopwatch') {
                btnStart.click();
            } else if (activeTab === 'timer') {
                btnTimerStart.click();
            }
        } else if (key === 'l' && activeTab === 'stopwatch') {
            // L -> Lap
            if (!btnLap.disabled) {
                btnLap.click();
            }
        } else if (key === 'r') {
            // R -> Reset Active tab tools
            if (activeTab === 'stopwatch' && !btnReset.disabled) {
                btnReset.click();
            } else if (activeTab === 'timer' && !btnTimerCancel.disabled) {
                btnTimerCancel.click();
            }
        } else if (key === 'escape') {
            // Escape -> Dismiss active alerts
            if (!alarmAlert.classList.contains('hidden')) {
                btnAlarmDismiss.click();
            }
        }
    });

    // ==========================================
    // 11. Initializer Startup runs
    // ==========================================
    loadTheme();
    loadAlarms();
    renderLaps();
    updateAnalytics();
    drawLapChart();
});
