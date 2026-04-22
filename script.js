let gameStarted = false;

let pendingEvents = {
    pollution: [],
    security: [],
    economy: []
};

let currentEvent = null;

// ระบบอีเวนต์ทุก 5 วัน
let canHoldEvent = false;
let nextEventCheckDay = 5;

// สถานะของเมือง
let stats = { budget: 500, approval: 50, pm25: 0, security: 50 };
let prevStats = {};
let maxStats = { budget: 1000, approval: 100, pm25: 100, security: 100 };
let currentDay = 1;
const MAX_DAYS = 30;

// ระบบเวลา
const phases = ['morning', 'day', 'sunset', 'night'];
const phaseTimes = ['06:00', '12:00', '18:30', '23:00'];
let currentPhaseIndex = 0;

// ภาพพื้นหลัง
const cityImages = [
    'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=1000&q=80'
];

// คลังเหตุการณ์ (ทุกอันมีตัวเลือก "ไม่ทำอะไรเลย")
const eventPool = [
    {
        type: "pollution",
        title: "PM2.5 สูงผิดปกติ",
        description: "ค่าฝุ่นละอองเกินมาตรฐาน ประชาชนเริ่มไม่พอใจและป่วยหนัก",
        defaultEffect: { approval: -15, pm25: 10 },
        choices: [
            { text: "ปิดโรงงานชั่วคราว", cost: "💰-100 ☁️-20", effects: { budget: -100, pm25: -20 } },
            { text: "แจกหน้ากากฟรี", cost: "💰-50 😊+10", effects: { budget: -50, approval: 10 } },
            { text: "ไม่ทำอะไรเลย", cost: "😊-15 ☁️+10", effects: { approval: -15, pm25: 10 } }
        ]
    },
    {
        type: "pollution",
        title: "ควันโรงงานเพิ่มขึ้น",
        description: "โรงงานในเมืองปล่อยควันพิษมากกว่าปกติ ชาวบ้านร้องเรียน",
        defaultEffect: { pm25: 15, approval: -10 },
        choices: [
            { text: "สั่งตรวจสอบและปรับโรงงาน", cost: "💰-80 ☁️-15 😊+5", effects: { budget: -80, pm25: -15, approval: 5 } },
            { text: "ติดตั้งเครื่องฟอกอากาศสาธารณะ", cost: "💰-60 ☁️-10", effects: { budget: -60, pm25: -10 } },
            { text: "ไม่ทำอะไรเลย", cost: "☁️+15 😊-10", effects: { pm25: 15, approval: -10 } }
        ]
    },
    {
        type: "pollution",
        title: "ไฟป่าลามเข้าเมือง",
        description: "ไฟป่าบริเวณรอบนอกทำให้อากาศเสียเข้าสู่เมือง",
        defaultEffect: { pm25: 20, approval: -5 },
        choices: [
            { text: "เรียกหน่วยดับเพลิงและรถฉีดน้ำ", cost: "💰-120 ☁️-20", effects: { budget: -120, pm25: -20 } },
            { text: "ประกาศให้อยู่บ้าน", cost: "💰-20 😊-5 ☁️-5", effects: { budget: -20, approval: -5, pm25: -5 } },
            { text: "ไม่ทำอะไรเลย", cost: "☁️+20 😊-5", effects: { pm25: 20, approval: -5 } }
        ]
    },
    {
        type: "security",
        title: "กลุ่มประท้วงเรียกร้องสวัสดิการ",
        description: "ประชาชนรวมตัวประท้วงหน้าศาลาว่าการ ต้องการคุณภาพชีวิตที่ดีขึ้น",
        defaultEffect: { approval: -30, security: -20 },
        choices: [
            { text: "เจรจาและอัดฉีดเงิน", cost: "💰-150 😊+25", effects: { budget: -150, approval: 25 } },
            { text: "ส่งกำลังสลายการชุมนุม", cost: "💰-50 🛡️+20 😊-30", effects: { budget: -50, approval: -30, security: 20 } },
            { text: "ไม่ทำอะไรเลย", cost: "😊-30 🛡️-20", effects: { approval: -30, security: -20 } }
        ]
    },
    {
        type: "security",
        title: "อาชญากรรมในย่านค้าขาย",
        description: "มีรายงานการปล้นและทำร้ายร่างกายในย่านตลาด ประชาชนหวาดกลัว",
        defaultEffect: { security: -25, approval: -10 },
        choices: [
            { text: "เพิ่มตำรวจลาดตระเวน", cost: "💰-100 🛡️+20", effects: { budget: -100, security: 20 } },
            { text: "ติดกล้องวงจรปิดเพิ่ม", cost: "💰-70 🛡️+15 😊+5", effects: { budget: -70, security: 15, approval: 5 } },
            { text: "ไม่ทำอะไรเลย", cost: "🛡️-25 😊-10", effects: { security: -25, approval: -10 } }
        ]
    },
    {
        type: "security",
        title: "น้ำท่วมฉับพลัน",
        description: "ฝนตกหนักทำให้ถนนหลายสายจมน้ำ ระบบขนส่งหยุดชะงัก",
        defaultEffect: { security: -15, budget: -50, approval: -10 },
        choices: [
            { text: "เปิดศูนย์อพยพและสูบน้ำ", cost: "💰-130 😊+10 🛡️+5", effects: { budget: -130, approval: 10, security: 5 } },
            { text: "ประกาศเตือนภัยและงดจราจร", cost: "💰-30 🛡️-10", effects: { budget: -30, security: -10 } },
            { text: "ไม่ทำอะไรเลย", cost: "🛡️-15 💰-50 😊-10", effects: { security: -15, budget: -50, approval: -10 } }
        ]
    },
    {
        type: "economy",
        title: "ภาษีเพิ่มทำให้ประชาชนไม่พอใจ",
        description: "นโยบายเก็บภาษีใหม่ทำให้ประชาชนส่วนหนึ่งออกมาต่อต้าน",
        defaultEffect: { approval: -20 },
        choices: [
            { text: "ยกเลิกนโยบาย", cost: "😊+15 💰-50", effects: { approval: 15, budget: -50 } },
            { text: "อธิบายและให้ข้อมูล", cost: "💰-20 😊-5", effects: { budget: -20, approval: -5 } },
            { text: "ไม่ทำอะไรเลย", cost: "😊-20", effects: { approval: -20 } }
        ]
    },
    {
        type: "economy",
        title: "งบประมาณรัดตัว",
        description: "รายจ่ายสาธารณะเกินงบ ต้องตัดสินใจว่าจะหาเงินจากไหน",
        defaultEffect: { budget: -80, approval: -5 },
        choices: [
            { text: "เก็บภาษีพิเศษ", cost: "💰+150 😊-20", effects: { budget: 150, approval: -20 } },
            { text: "ออกพันธบัตรเมือง", cost: "💰+100 🛡️-5", effects: { budget: 100, security: -5 } },
            { text: "ไม่ทำอะไรเลย", cost: "💰-80 😊-5", effects: { budget: -80, approval: -5 } }
        ]
    },
    {
        type: "economy",
        title: "นักลงทุนต่างชาติสนใจเมือง",
        description: "มีกลุ่มนักลงทุนต่างชาติสนใจมาลงทุนในเมือง แต่ต้องการเงินอุดหนุน",
        defaultEffect: { budget: -30 },
        choices: [
            { text: "อนุมัติการลงทุน", cost: "💰-100 (ได้คืน+200 ถัดไป)", effects: { budget: 100, approval: 10 } },
            { text: "ปฏิเสธ", cost: "ไม่มีผล", effects: {} },
            { text: "ไม่ทำอะไรเลย", cost: "💰-30", effects: { budget: -30 } }
        ]
    }
];

// คลังอีเวนต์พิเศษ (จัดได้ทุก 5 วัน)
const specialEvents = [
    { title: "เทศกาลดนตรี", desc: "จัดคอนเสิร์ตกลางเมือง สร้างบรรยากาศสนุกสนาน", cost: "💰-100 | 😊+20", effects: { budget: -100, approval: 20 } },
    { title: "ปลูกต้นไม้ใหญ่", desc: "โครงการปลูกต้นไม้ทั่วเมือง ลดมลพิษระยะยาว", cost: "💰-80 | ☁️-15", effects: { budget: -80, pm25: -15 } },
    { title: "เพิ่มตำรวจลาดตระเวน", desc: "จ้างตำรวจเพิ่มพิเศษชั่วคราว", cost: "💰-120 | 🛡️+25", effects: { budget: -120, security: 25 } },
    { title: "งานแสดงสินค้า", desc: "จัดงาน Expo ดึงดูดนักลงทุนและนักท่องเที่ยว", cost: "💰-90 | 💰+180 😊+10", effects: { budget: 90, approval: 10 } },
    { title: "วันสิ่งแวดล้อม", desc: "รณรงค์ลดขยะและมลพิษทั้งเมือง", cost: "💰-60 | ☁️-10 😊+15", effects: { budget: -60, pm25: -10, approval: 15 } },
    { title: "โครงการบ้านปลอดภัย", desc: "ติดตั้งระบบรักษาความปลอดภัยชุมชน", cost: "💰-110 | 🛡️+20 😊+10", effects: { budget: -110, security: 20, approval: 10 } }
];

// ฟังก์ชันเริ่มเกม
function startGame() {
    const startScreen = document.getElementById("screen-start");
    const dashboard = document.getElementById("main-dashboard");

    stats = { budget: 500, approval: 50, pm25: 0, security: 50 };
    prevStats = { ...stats };
    currentDay = 1;
    currentPhaseIndex = 0;
    canHoldEvent = false;
    nextEventCheckDay = 5;
    gameStarted = true;

    startScreen.style.display = "none";
    dashboard.style.display = "grid";

    updateUI();
    showModal('modal-howto');
}

// ปิดวิธีเล่น แล้วเริ่ม event แรก
function closeHowTo() {
    hideModal('modal-howto');
    triggerRandomEvent();
}

// passive effects (จำ)
function applyPassiveEffects() {
    if (stats.pm25 > 70) stats.approval -= 5;
    if (stats.budget < 500) stats.security -= 5;
    if (stats.security < 30) stats.approval -= 5;
    if (stats.approval < 30) stats.budget -= 5;
    if (stats.pm25 < 20) stats.approval += 3;
    if (stats.security > 80) stats.approval += 5;

    stats.budget = Math.max(0, Math.min(maxStats.budget, stats.budget));
    stats.approval = Math.max(0, Math.min(maxStats.approval, stats.approval));
    stats.pm25 = Math.max(0, Math.min(maxStats.pm25, stats.pm25));
    stats.security = Math.max(0, Math.min(maxStats.security, stats.security));
}

// Modal
function showModal(id) { document.getElementById(id).classList.add('active'); }
function hideModal(id) { document.getElementById(id).classList.remove('active'); }

// เคลียร์ event หลังจบวัน
function resolvePendingEvents() {
    Object.keys(pendingEvents).forEach(type => {
        pendingEvents[type].forEach(ev => {
            if (ev.defaultEffect) applyEffects(ev.defaultEffect);
        });
        pendingEvents[type] = [];
    });
}

// เปิดเมนูจัดการเมือง
function openMenu(type) {
    let menuData;

    if (type === 'pollution') {
        let desc = stats.pm25 > 70 ? "🚨 วิกฤตหนัก! มลพิษสูงมาก ประชาชนเริ่มป่วย"
            : stats.pm25 > 30 ? "⚠️ มลพิษเริ่มส่งผลต่อสุขภาพ"
            : "🌿 อากาศดี เมืองน่าอยู่";
        menuData = {
            title: "จัดการมลพิษ", description: desc,
            choices: [
                { text: "ปลูกต้นไม้", cost: "💰-50 ☁️-10", effects: { budget: -50, pm25: -10 } },
                { text: "ควบคุมโรงงาน", cost: "💰-100 ☁️-20 😊-5", effects: { budget: -100, pm25: -20, approval: -5 } },
                { text: "ติดตั้งเครื่องฟอกอากาศ", cost: "💰-70 ☁️-15", effects: { budget: -70, pm25: -15 } },
                { text: "รณรงค์ลดการเผา", cost: "💰-30 ☁️-8 😊+5", effects: { budget: -30, pm25: -8, approval: 5 } }
            ]
        };
    } else if (type === 'security') {
        let desc = stats.security < 30 ? "🚨 อาชญากรรมสูง เมืองไม่ปลอดภัย!"
            : stats.security < 70 ? "⚠️ ยังมีความเสี่ยง ต้องเฝ้าระวัง"
            : "👮 เมืองปลอดภัย ประชาชนอุ่นใจ";
        menuData = {
            title: "เพิ่มความปลอดภัย", description: desc,
            choices: [
                { text: "เพิ่มตำรวจ", cost: "💰-80 🛡️+20", effects: { budget: -80, security: 20 } },
                { text: "ติดกล้องวงจรปิด", cost: "💰-60 🛡️+15", effects: { budget: -60, security: 15 } },
                { text: "อบรมชุมชนเฝ้าระวัง", cost: "💰-40 🛡️+10 😊+5", effects: { budget: -40, security: 10, approval: 5 } },
                { text: "ซ่อมแสงสว่างถนน", cost: "💰-30 🛡️+8 😊+3", effects: { budget: -30, security: 8, approval: 3 } }
            ]
        };
    } else if (type === 'economy') {
        let desc = stats.budget < 100 ? "🚨 เงินใกล้หมด เมืองเสี่ยงล้มละลาย"
            : stats.budget < 500 ? "⚠️ งบเริ่มตึง ต้องบริหารดีๆ"
            : "💰 เศรษฐกิจดี มีงบเพียงพอ";
        menuData = {
            title: "จัดการเศรษฐกิจ", description: desc,
            choices: [
                { text: "เก็บภาษี", cost: "💰+100 😊-10", effects: { budget: 100, approval: -10 } },
                { text: "ส่งเสริมการค้า", cost: "💰-50 (คืน +120)", effects: { budget: 70, approval: 5 } },
                { text: "ออกพันธบัตรเมือง", cost: "💰+80 🛡️-5", effects: { budget: 80, security: -5 } },
                { text: "ลดรายจ่ายสาธารณะ", cost: "💰+60 😊-15", effects: { budget: 60, approval: -15 } }
            ]
        };
    }

    document.getElementById('event-title').innerText = menuData.title;
    document.getElementById('event-desc').innerText = menuData.description;

    const container = document.getElementById('choices-container');
    container.innerHTML = '';

    // แสดง pending events
    if (pendingEvents[type].length > 0) {
        const title = document.createElement('h4');
        title.innerText = "📌 เหตุการณ์ค้าง";
        title.style.marginBottom = "8px";
        container.appendChild(title);

        pendingEvents[type].forEach(ev => {
            ev.choices.forEach(choice => {
                const btn = document.createElement('button');
                btn.className = 'btn-action highlight';
                btn.innerHTML = `📌 ${ev.title}<br><small>${choice.text} (${choice.cost})</small>`;
                btn.onclick = () => {
                    triggerAction(choice.effects);
                    pendingEvents[type] = pendingEvents[type].filter(e => e !== ev);
                };
                container.appendChild(btn);
            });
        });

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

    // badge ปรับเป็น info แทน warning
    document.querySelector('#modal-event .badge').className = 'badge info';
    document.querySelector('#modal-event .badge').innerText = '🏙️ จัดการเมือง';
    showModal('modal-event');
}

// สีปุ่มจัดการเมือง
function updateButtonColors() {
    const pollutionBtn = document.getElementById("btn-pollution");
    const securityBtn = document.getElementById("btn-security");
    const economyBtn = document.getElementById("btn-economy");
    const eventBtn = document.getElementById("btn-event");

    pollutionBtn.style.background = stats.pm25 > 70 ? "rgb(180,5,5)"
        : stats.pm25 > 30 ? "rgba(234,179,8,0.3)" : "rgba(34,197,94,0.3)";
    securityBtn.style.background = stats.security < 30 ? "rgb(180,5,5)"
        : stats.security < 70 ? "rgba(234,179,8,0.3)" : "rgba(34,197,94,0.3)";
    economyBtn.style.background = stats.budget < 100 ? "rgb(180,5,5)"
        : stats.budget < 500 ? "rgba(234,179,8,0.3)" : "rgba(34,197,94,0.3)";

    // ปุ่มอีเวนต์
    const label = document.getElementById('event-btn-label');
    if (canHoldEvent) {
        eventBtn.style.background = "rgba(234,179,8,0.3)";
        eventBtn.style.borderColor = "var(--c-yellow)";
        eventBtn.disabled = false;
        label.innerText = "🎉 จัดได้เลย!";
    } else {
        eventBtn.style.background = "rgba(255,255,255,0.05)";
        eventBtn.style.borderColor = "var(--panel-border)";
        eventBtn.disabled = false;
        const daysLeft = nextEventCheckDay - currentDay;
        label.innerText = daysLeft > 0 ? `อีก ${daysLeft} วัน` : "รอรอบถัดไป...";
    }
}

// เปิดหน้าอีเวนต์
function openSchedule() {
    const container = document.getElementById('events-grid-container');
    const statusText = document.getElementById('schedule-status-text');
    container.innerHTML = '';

    if (!canHoldEvent) {
        const daysLeft = nextEventCheckDay - currentDay;
        statusText.innerText = daysLeft > 0
            ? `⏳ ยังไม่ถึงรอบจัดอีเวนต์ (อีก ${daysLeft} วัน)`
            : `⏳ รอรอบสุ่มถัดไป...`;
        showModal('modal-schedule');
        return;
    }

    statusText.innerText = "✅ คุณสามารถจัดอีเวนต์ได้ในวันนี้!";

    specialEvents.forEach(ev => {
        const card = document.createElement('div');
        card.className = 'event-card';
        card.innerHTML = `
            <h4>${ev.title}</h4>
            <p style="font-size:0.8rem; color:#94a3b8; margin: 5px 0;">${ev.desc}</p>
            <p class="cost">${ev.cost}</p>
            <button class="btn-action" onclick="holdSpecialEvent(${JSON.stringify(ev.effects).replace(/"/g, '&quot;')})">จัดเลย</button>
        `;
        container.appendChild(card);
    });

    showModal('modal-schedule');
}

function holdSpecialEvent(effects) {
    applyEffects(effects);
    canHoldEvent = false;
    nextEventCheckDay = currentDay + 5;
    hideModal('modal-schedule');
    updateButtonColors();
}

// ตรวจสอบรอบอีเวนต์ทุก 5 วัน
function checkEventCycle() {
    if (currentDay >= nextEventCheckDay && !canHoldEvent) {
        const roll = Math.random();
        canHoldEvent = roll > 0.3; // 70% โอกาสจัดได้
        if (!canHoldEvent) {
            nextEventCheckDay = currentDay + 5;
        }
    }
}

function openSchedule() {
    const container = document.getElementById('events-grid-container');
    const statusText = document.getElementById('schedule-status-text');
    container.innerHTML = '';

    if (!canHoldEvent) {
        const daysLeft = Math.max(0, nextEventCheckDay - currentDay);
        statusText.innerText = `⏳ ยังไม่ถึงรอบจัดอีเวนต์ (อีก ${daysLeft} วัน)`;
        showModal('modal-schedule');
        return;
    }

    statusText.innerText = "✅ คุณสามารถจัดอีเวนต์ได้ในวันนี้!";
    specialEvents.forEach(ev => {
        const card = document.createElement('div');
        card.className = 'event-card';
        card.innerHTML = `
            <h4>${ev.title}</h4>
            <p style="font-size:0.8rem; color:#94a3b8; margin:5px 0;">${ev.desc}</p>
            <p class="cost">${ev.cost}</p>
            <button class="btn-action" onclick='holdSpecialEvent(${JSON.stringify(ev.effects)})'>จัดเลย</button>
        `;
        container.appendChild(card);
    });

    showModal('modal-schedule');
}

// กดเลือกแล้วเดินเวลา
function triggerAction(effects) {
    applyEffects(effects);
    hideModal('modal-schedule');
    hideModal('modal-event');
    advanceTime();
}

// คำนวณผลกระทบ
function applyEffects(effects) {
    stats.budget += effects.budget || 0;
    stats.approval += effects.approval || 0;
    stats.pm25 += effects.pm25 || 0;
    stats.security += effects.security || 0;

    stats.budget = Math.max(0, Math.min(maxStats.budget, stats.budget));
    stats.approval = Math.max(0, Math.min(maxStats.approval, stats.approval));
    stats.pm25 = Math.max(0, Math.min(maxStats.pm25, stats.pm25));
    stats.security = Math.max(0, Math.min(maxStats.security, stats.security));

    updateUI();
    checkGameOver();
}

// ข้ามเวลา
function advanceTime() {
    currentPhaseIndex++;
    if (currentDay >= 10) applyPassiveEffects();

    if (currentPhaseIndex >= phases.length) {
        currentPhaseIndex = phases.length - 1;
        showDaySummary();
    } else {
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

    // คืน badge เป็น warning
    const badge = document.querySelector('#modal-event .badge');
    badge.className = 'badge warning';
    badge.innerText = '⚠️ เหตุการณ์ด่วน';

    const container = document.getElementById('choices-container');
    container.innerHTML = '';

    ev.choices.forEach(choice => {
        const btn = document.createElement('button');
        btn.className = 'btn-action';
        btn.innerHTML = `${choice.text}<br><small style="font-weight:normal">${choice.cost}</small>`;
        btn.onclick = () => triggerAction(choice.effects);
        container.appendChild(btn);
    });

    showModal('modal-event');
}

// สรุปจบวัน
function showDaySummary() {
    resolvePendingEvents();
    document.getElementById('summary-day').innerText = currentDay;

    const diffApproval = stats.approval - prevStats.approval;
    const diffBudget = stats.budget - prevStats.budget;
    const diffPm25 = stats.pm25 - prevStats.pm25;
    const diffSecurity = stats.security - prevStats.security;

    const sumApproval = document.getElementById('sum-approval');
    const sumBudget = document.getElementById('sum-budget');
    const sumPm25 = document.getElementById('sum-pm25');
    const sumSecurity = document.getElementById('sum-security');

    sumApproval.innerText = formatDiff(diffApproval);
    sumApproval.className = diffApproval >= 0 ? 'text-green' : 'text-red';
    sumBudget.innerText = formatDiff(diffBudget);
    sumBudget.className = diffBudget >= 0 ? 'text-green' : 'text-red';
    sumPm25.innerText = formatDiff(diffPm25);
    sumPm25.className = diffPm25 <= 0 ? 'text-green' : 'text-red'; // pm25 น้อยดีกว่า
    sumSecurity.innerText = formatDiff(diffSecurity);
    sumSecurity.className = diffSecurity >= 0 ? 'text-green' : 'text-red';

    showModal('modal-summary');
}

// เริ่มวันใหม่
function nextDay() {
    hideModal('modal-summary');
    prevStats = { ...stats };
    currentDay++;
    currentPhaseIndex = 0;

    if (currentDay > MAX_DAYS) {
        document.getElementById('screen-victory').classList.add('active');
        return;
    }

    checkEventCycle();
    updateUI();
    triggerRandomEvent();
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

// อัปเดต UI
function updateUI() {
    document.getElementById('q-approval').innerText = stats.approval;
    document.getElementById('q-budget').innerText = stats.budget;
    document.getElementById('q-pm25').innerText = stats.pm25;
    document.getElementById('q-security').innerText = stats.security;

    ['approval', 'budget', 'pm25', 'security'].forEach(key => {
        let percent = Math.max(0, Math.min(100, (stats[key] / maxStats[key]) * 100));
        document.getElementById(`bar-${key}`).style.width = `${percent}%`;
        document.getElementById(`val-${key}`).innerText = `${stats[key]}/${maxStats[key]}`;
    });

    document.getElementById('day-counter').innerText = currentDay;
    document.getElementById('time-display').innerText = phaseTimes[currentPhaseIndex];

    phases.forEach((p, idx) => {
        const el = document.getElementById(`phase-${p}`);
        if (el) {
            if (idx === currentPhaseIndex) el.classList.add('active');
            else el.classList.remove('active');
        }
    });

    document.body.className = `phase-${phases[currentPhaseIndex]}`;
    const cityBg = document.getElementById('city-bg');
    if (cityBg) cityBg.style.backgroundImage = `linear-gradient(to bottom, transparent, rgba(0,0,0,0.8)), url('${cityImages[currentPhaseIndex]}')`;

    checkGameOver();
    updateButtonColors();
}

function formatDiff(value) {
    return value > 0 ? `+${value}` : `${value}`;
}

// ปิด event modal → เก็บ pending
function closeEvent() {
    if (currentEvent) {
        pendingEvents[currentEvent.type].push(currentEvent);
    }
    currentEvent = null;
    hideModal('modal-event');
}

// Initialize
updateUI();