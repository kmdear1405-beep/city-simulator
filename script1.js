let gameStarted = false;
//จำ
let pendingEvents = {
    pollution: [],
    security: [],
    economy: []
};

let currentEvent = null;
//(จำ)
function startGame() {
    const startScreen = document.getElementById("screen-start");
    const dashboard = document.getElementById("main-dashboard");

    // reset เกม
    stats = { budget: 500, approval: 50, pm25: 0, security: 50 };

    prevStats = { ...stats };
    currentDay = 1;
    currentPhaseIndex = 0;

    gameStarted = true;

    startScreen.style.display = "none";
    dashboard.style.display = "grid";

    updateUI();
    triggerRandomEvent();
}

// สถานะของเมือง
let stats = { budget: 500, approval: 50, pm25: 0, security: 50 }; // pm25 ยิ่งน้อยยิ่งดี
let prevStats = {};
let maxStats = { budget: 1000, approval: 100, pm25: 100, security: 100 };
let currentDay = 1;
const MAX_DAYS = 30;

// ระบบเวลา
const phases = ['morning', 'day', 'sunset', 'night'];
const phaseTimes = ['06:00', '12:00', '18:30', '23:00'];
let currentPhaseIndex = 0;

//ภาพพื้นหลัง
const cityImages = [
    'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=1000&q=80' 
];


// คลังเหตุการณ์
const eventPool = [
    {
        type : "pollution",
        title: "PM2.5 สูงผิดปกติ",
        description: "ค่าฝุ่นละอองเกินมาตรฐาน ประชาชนเริ่มไม่พอใจและป่วยหนัก",
        defaultEffect: { approval: -15, pm25: 10 },
        choices: [
            { text: "ปิดโรงงานชั่วคราว", cost: "💰-100 ☁️-20", effects: { budget: -100, approval: 0, pm25: -20, security: 0 } },
            { text: "แจกหน้ากากฟรี", cost: "💰-50 😊+10", effects: { budget: -50, approval: 10, pm25: 0, security: 0 } },
            { text: "ไม่ทำอะไรเลย", cost: "😊-15 ☁️+10", effects: { budget: 0, approval: -15, pm25: 10, security: 0 } }
        ]
    },
    {
        type: "security",
        title: "กลุ่มประท้วงเรียกร้องสวัสดิการ",
        description: "ประชาชนรวมตัวประท้วงหน้าศาลาว่าการ ต้องการคุณภาพชีวิตที่ดีขึ้น",
        defaultEffect: { approval: -30, security: -20 },
        choices: [
            { text: "เจรจาและอัดฉีดเงิน", cost: "💰-150 😊+25", effects: { budget: -150, approval: 25, pm25: 0, security: 0 } },
            { text: "ส่งสลายการชุมนุม", cost: "💰-50 🛡️+20 😊-30", effects: { budget: -50, approval: -30, pm25: 0, security: 20 } }
        ]
    }
];

// อัปเดต UI ทั้งหมด
function updateUI() {
    // อัปเดต Quick Stats (ด้านซ้าย)
    document.getElementById('q-approval').innerText = stats.approval;
    document.getElementById('q-budget').innerText = stats.budget;
    document.getElementById('q-pm25').innerText = stats.pm25;
    document.getElementById('q-security').innerText = stats.security;

    // อัปเดต Detail Stats (ด้านขวา)
    ['approval', 'budget', 'pm25', 'security'].forEach(key => {
        let percent = (stats[key] / maxStats[key]) * 100;
        // บังคับไม่ให้เกิน 100% สำหรับการแสดงหลอด
        percent = Math.max(0, Math.min(100, percent)); 
        
        document.getElementById(`bar-${key}`).style.width = `${percent}%`;
        document.getElementById(`val-${key}`).innerText = `${stats[key]}/${maxStats[key]}`;
    });

    document.getElementById('day-counter').innerText = currentDay;
    document.getElementById('time-display').innerText = phaseTimes[currentPhaseIndex];
    
    // อัปเดตไฮไลท์ช่วงเวลา
    phases.forEach((p, idx) => {
        const el = document.getElementById(`phase-${p}`);
        if(idx === currentPhaseIndex) el.classList.add('active');
        else el.classList.remove('active');
    });

    // เปลี่ยนสี Background
    document.body.className = `phase-${phases[currentPhaseIndex]}`;
    const cityBg = document.getElementById('city-bg');
    if(cityBg) cityBg.style.backgroundImage = `linear-gradient(to bottom, transparent, rgba(0,0,0,0.8)), url('${cityImages[currentPhaseIndex]}')`;
    
    phases.forEach((p, idx) => {
        const el = document.getElementById(`phase-${p}`);
        if(el) {
            if(idx === currentPhaseIndex) el.classList.add('active');
            else el.classList.remove('active');
        }
    });

    checkGameOver();
    updateButtonColors();
} 
//passive (จำ)
function applyPassiveEffects() {
    if (stats.pm25 > 70) stats.approval -= 5;
    if (stats.budget < 500) stats.security -= 5;
    if (stats.security < 30) stats.approval -= 5;
    if (stats.approval < 30) stats.budget -= 5;
    if (stats.pm25 < 20) stats.approval += 3;
    if (stats.security > 80) stats.approval += 5;
   
    //กันค่าเกินstats(จำ)
    stats.budget = Math.max(0, Math.min(maxStats.budget, stats.budget));
    stats.approval = Math.max(0, Math.min(maxStats.approval, stats.approval));
    stats.pm25 = Math.max(0, Math.min(maxStats.pm25, stats.pm25));
    stats.security = Math.max(0, Math.min(maxStats.security, stats.security));

}
// ระบบจัดการ Modal
function showModal(id) { document.getElementById(id).classList.add('active'); }
function hideModal(id) { document.getElementById(id).classList.remove('active'); }

//เคลีย event หลังจบวัน (จำ)
function resolvePendingEvents() {

    Object.keys(pendingEvents).forEach(type => {

        pendingEvents[type].forEach(ev => {
            // ใช้ defaultEffect (เหมือนเลือก "ไม่ทำอะไร")
            if (ev.defaultEffect) {
                applyEffects(ev.defaultEffect);
            }
        });

        // ล้าง event หมวดนั้น
        pendingEvents[type] = [];
    });
}
// เปิดเมนูของจัดการต่างๆ(จำ)
function openMenu(type) {
    let menuData;

    // 🍃 มลพิษ
    if (type === 'pollution') {
        let desc = "";

        if (stats.pm25 > 70) {
            desc = "🚨 วิกฤตหนัก! มลพิษสูงมาก ประชาชนเริ่มป่วย";
        } else if (stats.pm25 > 30) {
            desc = "⚠️ มลพิษเริ่มส่งผลต่อสุขภาพ";
        } else {
            desc = "🌿 อากาศดี เมืองน่าอยู่";
        }

        menuData = {
            title: "จัดการมลพิษ",
            description: desc,
            choices: [
                {
                    text: "ปลูกต้นไม้",
                    cost: "💰-50 ☁️-10",
                    effects: { budget: -50, pm25: -10 }
                },
                {
                    text: "ควบคุมโรงงาน",
                    cost: "💰-100 ☁️-20 😊-5",
                    effects: { budget: -100, pm25: -20, approval: -5 }
                }
            ]
        };
    }

    // 🛡️ ความปลอดภัย
    else if (type === 'security') {
        let desc = "";

        if (stats.security < 30) {
            desc = "🚨 อาชญากรรมสูง เมืองไม่ปลอดภัย!";
        } else if (stats.security < 70) {
            desc = "⚠️ ยังมีความเสี่ยง ต้องเฝ้าระวัง";
        } else {
            desc = "👮 เมืองปลอดภัย ประชาชนอุ่นใจ"; 
        }

        menuData = {
            title: "เพิ่มความปลอดภัย",
            description: desc,
            choices: [
                {
                    text: "เพิ่มตำรวจ",
                    cost: "💰-80 🛡️+20",
                    effects: { budget: -80, security: 20 }
                }
            ]
        };
    }

    // 💰 เศรษฐกิจ
    else if (type === 'economy') {
        let desc = "";

        if (stats.budget < 100) {
            desc = "🚨 เงินใกล้หมด เมืองเสี่ยงล้มละลาย";
        } else if (stats.budget < 500) {
            desc = "⚠️ งบเริ่มตึง ต้องบริหารดีๆ";
        } else {
            desc = "💰 เศรษฐกิจดี มีงบเพียงพอ";
        }

        menuData = {
            title: "จัดการเศรษฐกิจ",
            description: desc,
            choices: [
                {
                    text: "เก็บภาษี",
                    cost: "💰+100 😊-10",
                    effects: { budget: 100, approval: -10 }
                }
            ]
        };
    }

    // 👇 แสดงผล
    document.getElementById('event-title').innerText = menuData.title;
    document.getElementById('event-desc').innerText = menuData.description;

    const container = document.getElementById('choices-container');
container.innerHTML = '';

// =======================
// 📌 EVENT ค้าง
// =======================
if (pendingEvents[type].length > 0) {

    const title = document.createElement('h4');
    title.innerText = "📌 เหตุการณ์ค้าง";
    container.appendChild(title);

    pendingEvents[type].forEach(ev => {
        ev.choices.forEach(choice => {

            const btn = document.createElement('button');
            btn.className = 'btn-action highlight';

            btn.innerHTML = `
                📌 ${ev.title}
                <br>
                <small>${choice.text} (${choice.cost})</small>
            `;

            btn.onclick = () => {
                triggerAction(choice.effects);
                pendingEvents[type] = pendingEvents[type].filter(e => e !== ev);
            };

            container.appendChild(btn);
        });
    });

    // เส้นแบ่ง
    const hr = document.createElement('hr');
    hr.style.margin = "10px 0";
    container.appendChild(hr);
}

    menuData.choices.forEach(choice => {
        const btn = document.createElement('button');
        btn.className = 'btn-action';
        btn.innerHTML = `${choice.text}<br><small>${choice.cost}</small>`;
        btn.onclick = () => triggerAction(choice.effects);
        container.appendChild(btn);
    });

    showModal('modal-event');
}
//สีของจัดการเมือง(จำ)
function updateButtonColors() {
    const pollutionBtn = document.getElementById("btn-pollution");
    const securityBtn = document.getElementById("btn-security");
    const economyBtn = document.getElementById("btn-economy");

    // 🌫️ มลพิษ
    if (stats.pm25 > 70) {
        pollutionBtn.style.background = "rgb(180, 5, 5)";
    } else if (stats.pm25 > 30) {
        pollutionBtn.style.background = "rgba(234,179,8,0.3)";
    } else {
        pollutionBtn.style.background = "rgba(34,197,94,0.3)";
    }

    // 🛡️ ความปลอดภัย
    if (stats.security < 30) {
        securityBtn.style.background = "rgb(180, 5, 5)";
    } else if (stats.security < 70) {
        securityBtn.style.background = "rgba(234,179,8,0.3)";
    } else {
        securityBtn.style.background = "rgba(34,197,94,0.3)";
    }

    // 💰 เศรษฐกิจ
    if (stats.budget < 100) {
        economyBtn.style.background = "rgb(180, 5, 5)";
    } else if (stats.budget < 500) {
        economyBtn.style.background = "rgba(234,179,8,0.3)";
    } else {
        economyBtn.style.background = "rgba(34,197,94,0.3)";
    }
}

function openSchedule() {
    showModal('modal-schedule');
}

// ฟังก์ชันกดรับผลกระทบจากปุ่ม
function triggerAction(effects) {
    applyEffects(effects);
    hideModal('modal-schedule');
    hideModal('modal-event');
    advanceTime(); // ทำกิจกรรมเสร็จ เวลาเดิน
}

// คำนวณผลกระทบ
function applyEffects(effects) {
    stats.budget += effects.budget || 0;
    stats.approval += effects.approval || 0;
    stats.pm25 += effects.pm25 || 0;
    stats.security += effects.security || 0;

    // ลิมิตค่าไม่ให้เกินขอบเขต
    stats.budget = Math.max(0, Math.min(maxStats.budget, stats.budget));
    stats.approval = Math.max(0, Math.min(maxStats.approval, stats.approval));
    stats.pm25 = Math.max(0, Math.min(maxStats.pm25, stats.pm25));
    stats.security = Math.max(0, Math.min(maxStats.security, stats.security));

    updateUI();
    checkGameOver();
}

// ข้ามเวลา / เดินหน้าเวลา
function advanceTime() {
    currentPhaseIndex++;
    //passive เริ่ม day 10 (จำ)
     if (currentDay >= 10) {
        applyPassiveEffects();
    }
    
    
    if (currentPhaseIndex >= phases.length) {
        // จบวัน
        currentPhaseIndex = phases.length - 1; // ล็อกไว้ที่กลางคืนก่อน
        showDaySummary();
    } else {
       
        
        // สุ่มเกิด Event ตอนเช้าหรือบ่าย
        if ((currentPhaseIndex === 0 || currentPhaseIndex === 1) && Math.random() > 0.5) {
            triggerRandomEvent();
        }
    }
    updateUI();
}

// สุ่ม Event
function triggerRandomEvent() {
    const ev = eventPool[Math.floor(Math.random() * eventPool.length)];
    currentEvent = ev;
    document.getElementById('event-title').innerText = ev.title;
    document.getElementById('event-desc').innerText = ev.description;
    
    const container = document.getElementById('choices-container');
    container.innerHTML = '';
    
    ev.choices.forEach(choice => {
        const btn = document.createElement('button');
        btn.className = 'btn-action';
        btn.innerHTML = `${choice.text} <br><small style="font-weight:normal">${choice.cost}</small>`;
        btn.onclick = () => triggerAction(choice.effects);
        container.appendChild(btn);
    });

    showModal('modal-event');
}

// สรุปจบวัน (จำ)
function showDaySummary() {

    resolvePendingEvents();
    document.getElementById('summary-day').innerText = currentDay;

    const diffApproval = stats.approval - prevStats.approval;
    const diffBudget = stats.budget - prevStats.budget;
    const diffPm25 = stats.pm25 - prevStats.pm25;
    const diffSecurity = stats.security - prevStats.security;

    document.getElementById('sum-approval').innerText = formatDiff(diffApproval);
    document.getElementById('sum-budget').innerText = formatDiff(diffBudget);
    document.getElementById('sum-pm25').innerText = formatDiff(diffPm25);
    document.getElementById('sum-security').innerText = formatDiff(diffSecurity);

    showModal('modal-summary');
}

// เริ่มวันใหม่
function nextDay() {
    hideModal('modal-summary');
    prevStats = { ...stats };
    currentDay++;
    currentPhaseIndex = 0; // กลับไปตอนเช้า
    
    if(currentDay > MAX_DAYS) {
        showModal('screen-victory');
        return;
    }
    
    updateUI();
    triggerRandomEvent(); // บังคับมี Event ทุกเช้า
}

// เช็คแพ้
function checkGameOver() {
    let reason = "";
    if (stats.budget <= 0) reason = "เงินกองคลังติดลบ เมืองล้มละลาย";
    else if (stats.approval <= 0) reason = "ความสุข = 0 ประชาชนลุกฮือล้มล้างคุณ";
    else if (stats.pm25 >= 100) reason = "มลพิษทะลุขีดสุด ประชาชนอพยพทิ้งเมือง";
    else if (stats.security <= 0) reason = "อาชญากรรมล้นเมือง เกิดกลียุคขั้นสุด";

    if (reason) {
        document.getElementById('gameover-reason').innerText = reason;
        document.getElementById('screen-gameover').classList.add('active');
    }
}
//เพิ่มตรงแสดงผล+ค่า(จำ)
function formatDiff(value) {
    return value > 0 ? `+${value}` : `${value}`;
}
//ปิดหน้าต่างอีเว้น จำ
function closeEvent() {
    if (currentEvent) {
        pendingEvents[currentEvent.type].push(currentEvent);
    }

    currentEvent = null;
    hideModal('modal-event');
}


// Initialize
updateUI();
