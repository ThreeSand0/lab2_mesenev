const canvas = document.getElementById('plotterCanvas');
const ctx = canvas.getContext('2d');

const inputZ = document.getElementById('input-z');
const errorBox = document.getElementById('error-box');

const wSlider = document.getElementById('w-slider');
const wVal = document.getElementById('w-val');
const zoomSlider = document.getElementById('zoom-slider');
const zoomVal = document.getElementById('zoom-val');
const gridSlider = document.getElementById('grid-slider');
const gridVal = document.getElementById('grid-val');

const autoWBtn = document.getElementById('autow-btn');
const resetCamBtn = document.getElementById('reset-cam-btn');
const presetBtns = document.querySelectorAll('.preset-btn');

// Состояние сцены
let wCoord = parseFloat(wSlider.value);
let wDirection = 1;
let gridSize = parseInt(gridSlider.value, 10);
let scale = parseInt(zoomSlider.value, 10);
const range = 5.5;

let angleX = 0.62;
let angleZ = 0.75;
let isDragging = false;
let prevMouse = { x: 0, y: 0 };
let autoPlayW = false;

// Безопасный парсер формул z = f(x, y, w)
function parseExpression(str) {
    let expr = str.toLowerCase().replace(/\s+/g, '');
    if (!expr || expr.endsWith('^') || expr.endsWith('+') || expr.endsWith('-') || expr.endsWith('*') || expr.endsWith('/')) {
        errorBox.textContent = 'Формула не завершена';
        return null;
    }

    expr = expr.replace(/\^/g, '**')
        .replace(/\bpi\b/g, 'Math.PI')
        .replace(/\be\b/g, 'Math.E')
        .replace(/\bsin\b/g, 'Math.sin')
        .replace(/\bcos\b/g, 'Math.cos')
        .replace(/\btan\b/g, 'Math.tan')
        .replace(/\bsqrt\b/g, 'Math.sqrt')
        .replace(/\babs\b/g, 'Math.abs')
        .replace(/\bexp\b/g, 'Math.exp')
        .replace(/\blog\b/g, 'Math.log')
        .replace(/\bmax\b/g, 'Math.max')
        .replace(/\bmin\b/g, 'Math.min');


    try {
        const fn = new Function('x', 'y', 'w', `return ${expr};`);
        const test = fn(1, 1, 0);
        if (typeof test !== 'number' || Number.isNaN(test)) {
            throw new Error('Invalid math');
        }
        errorBox.textContent = '';
        return fn;
    } catch (e) {
        errorBox.textContent = 'Ошибка в синтаксисе формулы';
        return null;
    }
}

let fnZ = parseExpression(inputZ.value);

function updateFormula() {
    const newZ = parseExpression(inputZ.value);
    if (newZ) {
        fnZ = newZ;
        if (!autoPlayW) render();
    }
}

inputZ.addEventListener('input', () => {
    clearActivePreset();
    updateFormula();
});

// Пресеты
function clearActivePreset() {
    presetBtns.forEach(btn => btn.classList.remove('active'));
}

presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        clearActivePreset();
        btn.classList.add('active');
        inputZ.value = btn.dataset.z;
        updateFormula();
    });
});

// Ползунок 4-й координаты W
wSlider.addEventListener('input', (e) => {
    wCoord = parseFloat(e.target.value);
    wVal.textContent = wCoord.toFixed(2);
    if (!autoPlayW) render();
});

// Ползунки масштаба и сетки
zoomSlider.addEventListener('input', (e) => {
    scale = parseInt(e.target.value, 10);
    zoomVal.textContent = scale;
    if (!autoPlayW) render();
});

gridSlider.addEventListener('input', (e) => {
    gridSize = parseInt(e.target.value, 10);
    gridVal.textContent = gridSize;
    if (!autoPlayW) render();
});

// Кнопка плавного изменения W
autoWBtn.addEventListener('click', () => {
    autoPlayW = !autoPlayW;
    autoWBtn.textContent = `Анимация W: ${autoPlayW ? 'Вкл' : 'Выкл'}`;
    autoWBtn.classList.toggle('active', autoPlayW);
    if (autoPlayW) animate();
});

resetCamBtn.addEventListener('click', () => {
    angleX = 0.62;
    angleZ = 0.75;
    scale = 32;
    zoomSlider.value = 32;
    zoomVal.textContent = '32';
    if (!autoPlayW) render();
});

// Вращение мышью и тачем
function startDrag(x, y) {
    isDragging = true;
    prevMouse = { x, y };
}

function moveDrag(x, y) {
    if (!isDragging) return;
    angleZ += (x - prevMouse.x) * 0.008;
    angleX += (y - prevMouse.y) * 0.008;
    prevMouse = { x, y };
    if (!autoPlayW) render();
}

function endDrag() {
    isDragging = false;
}

canvas.addEventListener('mousedown', e => startDrag(e.clientX, e.clientY));
window.addEventListener('mousemove', e => moveDrag(e.clientX, e.clientY));
window.addEventListener('mouseup', endDrag);

canvas.addEventListener('touchstart', e => {
    if (e.touches.length === 1) startDrag(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: true });

window.addEventListener('touchmove', e => {
    if (isDragging && e.touches.length === 1) {
        moveDrag(e.touches[0].clientX, e.touches[0].clientY);
    }
}, { passive: true });

window.addEventListener('touchend', endDrag);

// Палитра цвета по высоте Z для наглядности деформации
function getHeightColor(z, minZ, maxZ) {
    if (maxZ === minZ || !Number.isFinite(z)) return 'rgb(52, 211, 153)';
    let t = (z - minZ) / (maxZ - minZ);
    t = Math.max(0, Math.min(1, t));

    let r, g, b;
    if (t < 0.5) {
        const k = t * 2;
        r = Math.round(56 + (52 - 56) * k);
        g = Math.round(189 + (211 - 189) * k);
        b = Math.round(248 + (153 - 248) * k);
    } else {
        const k = (t - 0.5) * 2;
        r = Math.round(52 + (251 - 52) * k);
        g = Math.round(211 + (113 - 211) * k);
        b = Math.round(153 + (133 - 153) * k);
    }
    return `rgb(${r}, ${g}, ${b})`;
}

// Отрисовка 3D-среза при текущем W
function render() {
    if (!fnZ) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const step = (range * 2) / gridSize;
    const polygons = [];
    let minZ = Infinity;
    let maxZ = -Infinity;

    for (let i = 0; i < gridSize; i++) {
        const x = -range + i * step;
        const nextX = x + step;

        for (let j = 0; j < gridSize; j++) {
            const y = -range + j * step;
            const nextY = y + step;

            const z00 = fnZ(x, y, wCoord);
            const z10 = fnZ(nextX, y, wCoord);
            const z11 = fnZ(nextX, nextY, wCoord);
            const z01 = fnZ(x, nextY, wCoord);

            if (![z00, z10, z11, z01].every(Number.isFinite)) continue;

            const avgZ = (z00 + z10 + z11 + z01) * 0.25;
            if (avgZ < minZ) minZ = avgZ;
            if (avgZ > maxZ) maxZ = avgZ;

            polygons.push({
                pts: [
                    [x, y, z00],
                    [nextX, y, z10],
                    [nextX, nextY, z11],
                    [x, nextY, z01]
                ],
                avgZ,
                depth: 0,
                proj: null
            });
        }
    }

    const cosX = Math.cos(angleX), sinX = Math.sin(angleX);
    const cosZ = Math.cos(angleZ), sinZ = Math.sin(angleZ);
    const halfW = canvas.width / 2;
    const halfH = canvas.height / 2;

    for (let i = 0; i < polygons.length; i++) {
        const poly = polygons[i];
        let sumDepth = 0;
        const proj = new Array(4);

        for (let k = 0; k < 4; k++) {
            const [x, y, z] = poly.pts[k];

            const x1 = x * cosZ - y * sinZ;
            const y1 = x * sinZ + y * cosZ;

            const y2 = y1 * cosX - z * sinX;
            const z2 = y1 * sinX + z * cosX;

            sumDepth += z2;
            proj[k] = {
                x: x1 * scale + halfW,
                y: -y2 * scale + halfH
            };
        }

        poly.depth = sumDepth * 0.25;
        poly.proj = proj;
    }

    polygons.sort((a, b) => a.depth - b.depth);

    for (let i = 0; i < polygons.length; i++) {
        const poly = polygons[i];
        const p = poly.proj;

        ctx.beginPath();
        ctx.moveTo(p[0].x, p[0].y);
        ctx.lineTo(p[1].x, p[1].y);
        ctx.lineTo(p[2].x, p[2].y);
        ctx.lineTo(p[3].x, p[3].y);
        ctx.closePath();

        ctx.fillStyle = getHeightColor(poly.avgZ, minZ, maxZ);
        ctx.fill();

        ctx.strokeStyle = 'rgba(10, 14, 12, 0.28)';
        ctx.lineWidth = 0.6;
        ctx.stroke();
    }
}

function animate() {
    if (!autoPlayW) return;

    wCoord += 0.035 * wDirection;
    if (wCoord >= 3.14) {
        wCoord = 3.14;
        wDirection = -1;
    } else if (wCoord <= -3.14) {
        wCoord = -3.14;
        wDirection = 1;
    }

    wSlider.value = wCoord.toFixed(2);
    wVal.textContent = wCoord.toFixed(2);

    render();
    requestAnimationFrame(animate);
}

// Первичная отрисовка
render();
