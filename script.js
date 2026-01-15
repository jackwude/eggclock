const currentTimeEl = document.getElementById('currentTime');
const targetTimeInput = document.getElementById('targetTime');
const cookTimeInput = document.getElementById('cookTime');
const stepInput = document.getElementById('step');
const recommendedEl = document.getElementById('recommendedSetting');
const resultDetailsEl = document.getElementById('resultDetails');
const timelineEl = document.getElementById('timeline');

function updateTime() {
    const now = new Date();
    currentTimeEl.textContent = now.toLocaleTimeString('zh-CN', { hour12: false });
    calculate();
}

function calculate() {
    const now = new Date();
    const [targetHours, targetMinutes] = targetTimeInput.value.split(':').map(Number);
    const cookMinutes = parseInt(cookTimeInput.value, 10) || 0;
    const step = parseFloat(stepInput.value);

    // 1. Determine Target Ready Time (Next occurrence)
    let targetDate = new Date(now);
    targetDate.setHours(targetHours, targetMinutes, 0, 0);

    // If target is in the past (e.g. now 22:00, target 07:30 -> target is today 07:30 < now), move to tomorrow
    // actually, even if it's 22:00 and target is 23:00, that's today.
    // User scenario: "Evening" planning for "Next Morning".
    // If Now is 22:00, Target 07:30. TargetDate (today 7:30) < Now. Add 1 day.
    if (targetDate <= now) {
        targetDate.setDate(targetDate.getDate() + 1);
    }
    
    // 2. Calculate Required Start Time
    // Start Time = Target Ready Time - Cook Duration
    const startCookDate = new Date(targetDate.getTime() - cookMinutes * 60000);

    // 3. Calculate Ideal Countdown (Duration from Now to Start)
    const diffMs = startCookDate - now;
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffMs < 0) {
        recommendedEl.textContent = "立即开始";
        resultDetailsEl.textContent = "时间不够了！即使现在开始也无法准时完成。";
        timelineEl.innerHTML = '';
        return;
    }

    // 4. Round Down to Step
    // e.g. Ideal 8.2h, Step 0.5 -> 8.0h.
    // e.g. Ideal 8.9h, Step 0.5 -> 8.5h.
    const recommendedSetting = Math.floor(diffHours / step) * step;

    // 5. Calculate Resulting Times
    // If we set the recommended setting...
    // The machine starts in `recommendedSetting` hours.
    const actualStartDate = new Date(now.getTime() + recommendedSetting * 60 * 60 * 1000);
    const actualReadyDate = new Date(actualStartDate.getTime() + cookMinutes * 60000);

    // Format output
    recommendedEl.textContent = `${recommendedSetting} 小时`;
    
    // Calculate difference from target
    const timeDiffMinutes = Math.round((targetDate - actualReadyDate) / 60000);
    const earlyText = timeDiffMinutes > 0 
        ? `提前 ${timeDiffMinutes} 分钟完成` 
        : `准时完成`;
    
    resultDetailsEl.innerHTML = `
        设置倒计时后，机器将在 <strong>${formatTime(actualStartDate)}</strong> 启动<br>
        预计 <strong>${formatTime(actualReadyDate)}</strong> 熟透 (${earlyText})
    `;

    // 6. Visualization
    // No complex viz for now, just text summary
}

function formatTime(date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    // Check if it's tomorrow relative to now?
    // Simply showing HH:MM is usually enough, but let's add "Tomorrow" if needed?
    // For simplicity, just HH:MM as the user knows the context.
    return `${hours}:${minutes}`;
}

// Event Listeners
targetTimeInput.addEventListener('input', calculate);
cookTimeInput.addEventListener('input', calculate);
stepInput.addEventListener('input', calculate);

// Init
setInterval(updateTime, 1000);
updateTime();
calculate();
