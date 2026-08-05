// Pillar 1: Adaptive Sports Mechanics & Scoring System
let totalScore = 0;
let streak = 0;

function updateScore(pts, msg) {
    totalScore += pts;
    streak++;
    const scoreVal = document.getElementById('score-val');
    const streakVal = document.getElementById('streak-val');

    if (scoreVal) scoreVal.textContent = totalScore;
    if (streakVal) streakVal.textContent = `${streak} 🔥`;

    showToast(msg || `+${pts} PTS!`);
}

function showToast(text) {
    const toast = document.getElementById('feedback-toast');
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 1600);
}

// 1. Basketball Shot Mechanics
function shootBasketball() {
    const ball = document.getElementById('basketball-mesh');
    if (!ball) return;
    if (typeof playSound === 'function') playSound('swish');

    ball.setAttribute('animation__shot', 'property: position; from: 0 1.1 -3; to: 0 3.2 -7.2; dur: 750; easing: easeOutQuad');

    setTimeout(() => {
        updateScore(50, 'SWISH! +50 PTS');
        ball.setAttribute('position', '0 1.1 -3');
        ball.removeAttribute('animation__shot');
    }, 800);
}

// 2. Slalom Glider Gates
function passSlalomGate(el, gateName) {
    if (typeof playSound === 'function') playSound('swish');
    if (el) {
        el.setAttribute('animation__pass', 'property: scale; from: 1 1 1; to: 1.4 1.4 1.4; dur: 300; dir: alternate; loop: 2');
    }
    updateScore(30, `${gateName} PASSED! +30 PTS`);
    if (el) {
        setTimeout(() => el.removeAttribute('animation__pass'), 700);
    }
}

// 3. Precision Archery Target
function shootArchery(pts) {
    if (typeof playSound === 'function') playSound('strike');
    updateScore(pts, `BULLSEYE! +${pts} PTS`);
}

// 4. Ramp Bowling Roll
function rollBowlingBall() {
    const ball = document.getElementById('bowling-ball');
    const pins = document.getElementById('pins-group');
    if (!ball || !pins) return;
    if (typeof playSound === 'function') playSound('strike');

    ball.setAttribute('animation__roll', 'property: position; from: 0 0.6 -2.5; to: 0 0.5 -9.5; dur: 900; easing: easeInQuad');

    setTimeout(() => {
        pins.setAttribute('animation__knock', 'property: rotation; to: -45 30 0; dur: 400');
        updateScore(100, 'STRIKE! ALL PINS DOWN +100 PTS');
        setTimeout(() => {
            ball.setAttribute('position', '0 0.6 -2.5');
            ball.removeAttribute('animation__roll');
            pins.setAttribute('rotation', '0 0 0');
            pins.removeAttribute('animation__knock');
        }, 1200);
    }, 950);
}
