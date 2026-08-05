// Main Application Controller & Station Switcher
let currentStation = 'basketball';

function selectStation(stationKey) {
    if (typeof playSound === 'function') playSound('click');
    currentStation = stationKey;

    // Update desktop HTML buttons
    document.querySelectorAll('.station-btn').forEach((btn, i) => {
        const stations = ['basketball', 'slalom', 'archery', 'bowling'];
        btn.classList.toggle('active', stations[i] === stationKey);
    });

    // Switch 3D station visibility
    ['basketball', 'slalom', 'archery', 'bowling'].forEach(s => {
        const stationEl = document.getElementById(`station-${s}`);
        if (stationEl) {
            stationEl.setAttribute('visible', s === stationKey);
        }
    });

    // Sync VR station selector buttons
    if (typeof updateVRStationSelector === 'function') {
        updateVRStationSelector(stationKey);
    }

    // Update single-switch targets if active
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

// ── VR Mode Event Handlers ───────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    console.log('Icha Khel Engine initialized cleanly.');

    const scene = document.querySelector('a-scene');
    if (!scene) return;

    // Wait for A-Frame scene to be ready
    scene.addEventListener('loaded', () => {
        console.log('A-Frame scene loaded — Quest 3 ready.');
    });

    // Handle VR Enter — hide welcome panel after a delay
    scene.addEventListener('enter-vr', () => {
        console.log('Entered VR mode — Quest 3 immersive session active.');

        // Show welcome panel briefly, then auto-hide
        const welcome = document.getElementById('vr-welcome-panel');
        if (welcome) {
            welcome.setAttribute('visible', true);
            setTimeout(() => {
                welcome.setAttribute('visible', false);
            }, 8000); // Auto-hide after 8 seconds
        }

        // Hide the Enter VR button
        const vrBtn = document.getElementById('enter-vr-btn');
        if (vrBtn) vrBtn.style.display = 'none';
    });

    // Handle VR Exit — restore desktop UI
    scene.addEventListener('exit-vr', () => {
        console.log('Exited VR mode — desktop view restored.');

        // Show the Enter VR button again
        const vrBtn = document.getElementById('enter-vr-btn');
        if (vrBtn) vrBtn.style.display = '';
    });
});
