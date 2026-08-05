// =====================================================================
// VR Controls Module — Meta Quest 3 Optimized
// Handles: Thumbstick locomotion, Snap-turn, Haptics, VR HUD, 
//          Controller interactions, Button mapping
// =====================================================================

// ── Snap-Turn Component ──────────────────────────────────────────────
// Right thumbstick: 45° snap rotation for comfortable VR turning
AFRAME.registerComponent('snap-turn', {
    schema: {
        turnAngle: { type: 'number', default: 45 },
        hand: { type: 'string', default: 'right' }
    },

    init: function () {
        this.turnReady = true;
        this.rig = document.getElementById('rig');
    },

    tick: function () {
        const hand = this.data.hand === 'right'
            ? document.getElementById('right-hand')
            : document.getElementById('left-hand');
        if (!hand || !hand.components['tracked-controls']) return;

        const gamepad = hand.components['tracked-controls'].controller;
        if (!gamepad || !gamepad.axes) return;

        // Thumbstick X axis (axes[2] for right, axes[0] for left on Quest)
        const axisX = this.data.hand === 'right' ? gamepad.axes[2] : gamepad.axes[0];

        if (Math.abs(axisX) > 0.7 && this.turnReady) {
            this.turnReady = false;
            const currentRotation = this.rig.getAttribute('rotation') || { x: 0, y: 0, z: 0 };
            const direction = axisX > 0 ? -1 : 1;
            const newY = currentRotation.y + (this.data.turnAngle * direction);

            this.rig.setAttribute('rotation', { x: 0, y: newY, z: 0 });
            triggerHaptic(this.data.hand, 0.3, 80);

            if (typeof playSound === 'function') playSound('click');
        }

        if (Math.abs(axisX) < 0.3) {
            this.turnReady = true;
        }
    }
});

// ── Thumbstick Locomotion Component ──────────────────────────────────
// Left thumbstick: Smooth forward/back/strafe movement
AFRAME.registerComponent('thumbstick-move', {
    schema: {
        speed: { type: 'number', default: 3 },
        hand: { type: 'string', default: 'left' }
    },

    init: function () {
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.rig = document.getElementById('rig');
        this.camera = document.getElementById('camera');
    },

    tick: function (time, delta) {
        if (!delta) return;

        const hand = this.data.hand === 'left'
            ? document.getElementById('left-hand')
            : document.getElementById('right-hand');
        if (!hand || !hand.components['tracked-controls']) return;

        const gamepad = hand.components['tracked-controls'].controller;
        if (!gamepad || !gamepad.axes) return;

        // Left thumbstick axes
        const axisX = gamepad.axes[2] || gamepad.axes[0] || 0;
        const axisY = gamepad.axes[3] || gamepad.axes[1] || 0;

        if (Math.abs(axisX) < 0.15 && Math.abs(axisY) < 0.15) return;

        // Get camera's forward direction (ignore pitch)
        const camRotation = this.camera.object3D.getWorldQuaternion(new THREE.Quaternion());
        const euler = new THREE.Euler().setFromQuaternion(camRotation, 'YXZ');

        // Also factor in rig rotation
        const rigRotation = this.rig.getAttribute('rotation') || { x: 0, y: 0, z: 0 };
        const totalYaw = euler.y;

        // Calculate movement direction relative to camera facing
        this.direction.set(0, 0, 0);

        // Forward/backward (negative Z is forward in A-Frame)
        if (Math.abs(axisY) > 0.15) {
            this.direction.z += axisY;
        }
        // Strafe left/right
        if (Math.abs(axisX) > 0.15) {
            this.direction.x += axisX;
        }

        // Normalize and apply camera yaw rotation
        this.direction.normalize();
        this.direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), totalYaw);

        // Apply movement
        const speed = this.data.speed * (delta / 1000);
        const rigPos = this.rig.getAttribute('position');
        this.rig.setAttribute('position', {
            x: rigPos.x + this.direction.x * speed,
            y: rigPos.y,
            z: rigPos.z + this.direction.z * speed
        });
    }
});

// ── Quest Controller Interaction Component ───────────────────────────
// Maps trigger, grip, and face buttons to game actions
AFRAME.registerComponent('quest-controls', {
    schema: {
        hand: { type: 'string', default: 'right' }
    },

    init: function () {
        const el = this.el;
        const hand = this.data.hand;

        // Trigger = primary action (shoot/interact)
        el.addEventListener('triggerdown', () => {
            this.onTrigger();
        });

        // Grip = grab action
        el.addEventListener('gripdown', () => {
            this.onGrip();
        });

        // A/X button = cycle stations
        el.addEventListener('abuttondown', () => {
            this.cycleStation(1);
        });
        el.addEventListener('xbuttondown', () => {
            this.cycleStation(-1);
        });

        // B/Y button = toggle accessibility menu visibility
        el.addEventListener('bbuttondown', () => {
            this.toggleVRMenu();
        });
        el.addEventListener('ybuttondown', () => {
            this.toggleVRMenu();
        });
    },

    onTrigger: function () {
        triggerHaptic(this.data.hand, 0.5, 100);

        // If single-switch mode is on, use switch activation
        if (typeof singleSwitchEnabled !== 'undefined' && singleSwitchEnabled) {
            if (typeof activateTarget === 'function') activateTarget();
            return;
        }

        // Otherwise fire the current station's primary action
        if (typeof currentStation === 'undefined') return;

        switch (currentStation) {
            case 'basketball':
                if (typeof shootBasketball === 'function') shootBasketball();
                break;
            case 'slalom':
                // Slalom gates are activated via raycaster click
                break;
            case 'archery':
                if (typeof shootArchery === 'function') shootArchery(100);
                break;
            case 'bowling':
                if (typeof rollBowlingBall === 'function') rollBowlingBall();
                break;
        }
    },

    onGrip: function () {
        triggerHaptic(this.data.hand, 0.3, 60);

        // Grip on basketball = throw with force
        if (typeof currentStation !== 'undefined' && currentStation === 'basketball') {
            if (typeof shootBasketball === 'function') shootBasketball();
        }
    },

    cycleStation: function (direction) {
        const stations = ['basketball', 'slalom', 'archery', 'bowling'];
        if (typeof currentStation === 'undefined') return;

        let idx = stations.indexOf(currentStation);
        idx = (idx + direction + stations.length) % stations.length;

        if (typeof selectStation === 'function') {
            selectStation(stations[idx]);
            // Update the HTML buttons too
            document.querySelectorAll('.station-btn').forEach((btn, i) => {
                btn.classList.toggle('active', i === idx);
            });
        }
        triggerHaptic(this.data.hand, 0.4, 80);
        updateVRStationSelector(stations[idx]);
    },

    toggleVRMenu: function () {
        const vrMenu = document.getElementById('vr-accessibility-panel');
        if (vrMenu) {
            const visible = vrMenu.getAttribute('visible');
            vrMenu.setAttribute('visible', !visible);
        }
    }
});

// ── VR HUD Component ─────────────────────────────────────────────────
// Manages the in-VR floating UI panels (score, station indicator, toast)
AFRAME.registerComponent('vr-hud', {
    init: function () {
        this.isVR = false;
        const scene = this.el.sceneEl;

        scene.addEventListener('enter-vr', () => {
            this.isVR = true;
            this.showVRPanels(true);
            this.hideHTMLOverlays(true);
        });

        scene.addEventListener('exit-vr', () => {
            this.isVR = false;
            this.showVRPanels(false);
            this.hideHTMLOverlays(false);
        });
    },

    showVRPanels: function (show) {
        const panels = [
            'vr-scoreboard',
            'vr-station-selector',
            'vr-welcome-panel'
        ];
        panels.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.setAttribute('visible', show);
        });
    },

    hideHTMLOverlays: function (hide) {
        const overlays = [
            'hud-header',
            'sports-selector',
            'accessibility-dock',
            'single-switch-bar'
        ];
        overlays.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = hide ? 'none' : '';
        });
    }
});

// ── Haptic Feedback Utility ──────────────────────────────────────────
function triggerHaptic(hand, intensity, durationMs) {
    const handEl = document.getElementById(hand === 'left' ? 'left-hand' : 'right-hand');
    if (!handEl || !handEl.components['tracked-controls']) return;

    const gamepad = handEl.components['tracked-controls'].controller;
    if (gamepad && gamepad.hapticActuators && gamepad.hapticActuators.length > 0) {
        gamepad.hapticActuators[0].pulse(intensity || 0.5, durationMs || 100);
    }
    // Quest 3 uses vibrationActuator API
    if (gamepad && gamepad.vibrationActuator) {
        gamepad.vibrationActuator.playEffect('dual-rumble', {
            duration: durationMs || 100,
            strongMagnitude: intensity || 0.5,
            weakMagnitude: (intensity || 0.5) * 0.5
        });
    }
}

// ── VR Scoreboard Update ─────────────────────────────────────────────
function updateVRScoreboard(score, streak) {
    const scoreText = document.getElementById('vr-score-text');
    const streakText = document.getElementById('vr-streak-text');
    if (scoreText) scoreText.setAttribute('value', `Score: ${score}`);
    if (streakText) streakText.setAttribute('value', `Streak: ${streak} fire`);
}

// ── VR Toast Display ─────────────────────────────────────────────────
function showVRToast(text) {
    const toast = document.getElementById('vr-toast-text');
    if (!toast) return;

    toast.setAttribute('value', text);
    toast.setAttribute('visible', true);
    toast.setAttribute('animation__fadein', 'property: opacity; from: 0; to: 1; dur: 200');
    toast.setAttribute('animation__pop', 'property: scale; from: 0.5 0.5 0.5; to: 1.2 1.2 1.2; dur: 300; easing: easeOutBack');

    setTimeout(() => {
        toast.setAttribute('animation__fadeout', 'property: opacity; from: 1; to: 0; dur: 400');
        setTimeout(() => {
            toast.setAttribute('visible', false);
            toast.removeAttribute('animation__fadein');
            toast.removeAttribute('animation__fadeout');
            toast.removeAttribute('animation__pop');
        }, 450);
    }, 1800);
}

// ── VR Station Selector Update ───────────────────────────────────────
function updateVRStationSelector(activeStation) {
    const stations = ['basketball', 'slalom', 'archery', 'bowling'];
    stations.forEach(s => {
        const btn = document.getElementById(`vr-btn-${s}`);
        if (btn) {
            const isActive = (s === activeStation);
            btn.setAttribute('material', `color: ${isActive ? '#7c3aed' : '#1a1035'}; opacity: ${isActive ? 0.95 : 0.7}; transparent: true`);
        }
    });

    // Update the station label
    const label = document.getElementById('vr-station-label');
    const names = {
        basketball: 'Adaptive Basketball',
        slalom: 'Slalom Glider',
        archery: 'Precision Archery',
        bowling: 'Ramp Bowling'
    };
    if (label) label.setAttribute('value', names[activeStation] || '');
}
