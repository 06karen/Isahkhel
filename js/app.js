// Main Application Controller & Station Switcher
let currentStation = 'basketball';

function selectStation(stationKey) {
    if (typeof playSound === 'function') playSound('click');
    currentStation = stationKey;

    document.querySelectorAll('.station-btn').forEach(btn => btn.classList.remove('active'));
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }

    ['basketball', 'slalom', 'archery', 'bowling'].forEach(s => {
        const stationEl = document.getElementById(`station-${s}`);
        if (stationEl) {
            stationEl.setAttribute('visible', s === stationKey);
        }
    });

    if (typeof singleSwitchEnabled !== 'undefined' && singleSwitchEnabled && typeof updateSwitchTargets === 'function') {
        updateSwitchTargets();
    }
    flashVignette();
}

function flashVignette() {
    const v = document.getElementById('comfort-vignette');
    if (!v) return;
    v.classList.add('active');
    setTimeout(() => v.classList.remove('active'), 250);
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('Icha Khel Engine initialized cleanly.');
});
