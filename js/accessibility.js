// Universal Accessibility Locomotion & Input Engine
let gazeEnabled = true;
let singleSwitchEnabled = false;
let autoAim = true;
let switchTargets = [];
let switchIndex = 0;

function toggleGaze(enabled) {
    gazeEnabled = enabled;
    const cursor = document.getElementById('gaze-cursor');
    if (cursor) {
        cursor.setAttribute('cursor', `fuse: ${enabled}; fuseTimeout: 1200`);
        cursor.setAttribute('visible', enabled);
    }
    if (typeof playSound === 'function') playSound('click');
}

function toggleSingleSwitch(enabled) {
    singleSwitchEnabled = enabled;
    if (typeof playSound === 'function') playSound('click');

    if (enabled) {
        updateSwitchTargets();
        highlightNextTarget();
    } else {
        clearHighlights();
    }
}

function toggleSeated(seated) {
    const camera = document.getElementById('camera');
    if (camera) {
        camera.setAttribute('position', `0 ${seated ? 1.1 : 1.6} 0`);
    }
    if (typeof playSound === 'function') playSound('click');
}

function toggleAutoAim(enabled) {
    autoAim = enabled;
    if (typeof playSound === 'function') playSound('click');
}

function updateSwitchTargets() {
    if (typeof currentStation === 'undefined') return;
    switchTargets = Array.from(document.querySelectorAll(`#station-${currentStation} .sports-target`));
    switchIndex = 0;
}

function highlightNextTarget() {
    if (!singleSwitchEnabled || switchTargets.length === 0) return;
    clearHighlights();

    const target = switchTargets[switchIndex % switchTargets.length];
    if (target) {
        target.setAttribute('animation__pulse', 'property: scale; from: 1 1 1; to: 1.2 1.2 1.2; dur: 400; dir: alternate; loop: true');
    }
}

function activateTarget() {
    if (switchTargets.length === 0) return;
    const target = switchTargets[switchIndex % switchTargets.length];
    if (target) {
        target.click();
    }
    switchIndex++;
    highlightNextTarget();
}

function clearHighlights() {
    switchTargets.forEach(t => t.removeAttribute('animation__pulse'));
}

// Global Event Listeners for Single Switch Controls (Spacebar, Screen Touch, VR Triggers)
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && singleSwitchEnabled) {
        e.preventDefault();
        activateTarget();
    }
});

window.addEventListener('touchstart', () => {
    if (singleSwitchEnabled) activateTarget();
});

document.addEventListener('DOMContentLoaded', () => {
    // Quest 3 controller triggers as single-switch input
    const setupVRTriggers = () => {
        document.querySelectorAll('#left-hand, #right-hand').forEach(hand => {
            hand.addEventListener('triggerdown', () => {
                if (singleSwitchEnabled) activateTarget();
            });
            // Grip can also serve as switch input for accessibility
            hand.addEventListener('gripdown', () => {
                if (singleSwitchEnabled) activateTarget();
            });
        });
    };

    // A-Frame entities may not be ready immediately — wait for scene
    const scene = document.querySelector('a-scene');
    if (scene) {
        if (scene.hasLoaded) {
            setupVRTriggers();
        } else {
            scene.addEventListener('loaded', setupVRTriggers);
        }
    }
});
