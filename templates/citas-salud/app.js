// ====================================================================
// MEDICONNECT - MOTOR DE AGENDA DE TURNOS & RECORDATORIOS
// ====================================================================

const CLINIC_CONFIG = {
  name: "MediConnect Centro Médico",
  whatsapp: "5491154188294"
};

const DOCTORS = [
  {
    id: "doc-1",
    name: "Dra. Valentina Rossi",
    specialty: "Odontología Integral",
    matricula: "M.N. 48.912",
    image: "assets/doctor_1.jpg",
    days: ["Lunes", "Miércoles", "Viernes"]
  },
  {
    id: "doc-2",
    name: "Dr. Lucas Benítez",
    specialty: "Dermatología & Estética",
    matricula: "M.N. 52.104",
    image: "assets/doctor_2.jpg",
    days: ["Martes", "Jueves"]
  },
  {
    id: "doc-3",
    name: "Dra. Camila Méndez",
    specialty: "Psicología Clínica",
    matricula: "M.N. 61.450",
    image: "assets/doctor_3.jpg",
    days: ["Lunes", "Martes", "Jueves"]
  }
];

const AVAILABLE_DAYS = [
  { label: "Lunes 10 Nov", day: "Lunes" },
  { label: "Martes 11 Nov", day: "Martes" },
  { label: "Miércoles 12 Nov", day: "Miércoles" },
  { label: "Jueves 13 Nov", day: "Jueves" },
  { label: "Viernes 14 Nov", day: "Viernes" }
];

const TIME_SLOTS = [
  { time: "09:30 hs", busy: false },
  { time: "10:15 hs", busy: true },
  { time: "11:00 hs", busy: false },
  { time: "14:30 hs", busy: false },
  { time: "15:15 hs", busy: false },
  { time: "16:00 hs", busy: true }
];

let selectedDoctor = DOCTORS[0];
let selectedDay = AVAILABLE_DAYS[0];
let selectedTime = TIME_SLOTS[0].time;

document.addEventListener("DOMContentLoaded", () => {
  renderDoctors();
  renderDays();
  renderSlots();
  setupAppointmentForm();
});

function renderDoctors() {
  const container = document.getElementById("doctors-container");
  container.innerHTML = DOCTORS.map(doc => `
    <div class="doctor-card ${selectedDoctor.id === doc.id ? 'selected' : ''}" onclick="selectDoctor('${doc.id}')">
      <img src="${doc.image}" alt="${doc.name}" class="doctor-img" />
      <h5 class="doctor-name">${doc.name}</h5>
      <span class="doctor-spec">${doc.specialty}</span>
      <span class="doctor-mat">${doc.matricula}</span>
      <span style="font-size: 0.72rem; color: #16a34a; font-weight: 700;">Atención: ${doc.days.join(", ")}</span>
    </div>
  `).join("");
}

window.selectDoctor = function(docId) {
  selectedDoctor = DOCTORS.find(d => d.id === docId);
  renderDoctors();
};

function renderDays() {
  const container = document.getElementById("days-container");
  container.innerHTML = AVAILABLE_DAYS.map((d, idx) => `
    <button type="button" class="day-btn ${selectedDay.label === d.label ? 'active' : ''}" onclick="selectDay(${idx})">
      ${d.label}
    </button>
  `).join("");
}

window.selectDay = function(idx) {
  selectedDay = AVAILABLE_DAYS[idx];
  renderDays();
};

function renderSlots() {
  const container = document.getElementById("slots-container");
  container.innerHTML = TIME_SLOTS.map(s => `
    <button 
      type="button" 
      class="slot-btn ${selectedTime === s.time ? 'active' : ''} ${s.busy ? 'busy' : ''}"
      ${s.busy ? 'disabled' : ''}
      onclick="selectTime('${s.time}')"
    >
      ${s.time} ${s.busy ? '(Ocupado)' : ''}
    </button>
  `).join("");
}

window.selectTime = function(t) {
  selectedTime = t;
  renderSlots();
};

function setupAppointmentForm() {
  document.getElementById("appointment-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("patient-name").value.trim();
    const phone = document.getElementById("patient-phone").value.trim();
    const reason = document.getElementById("patient-reason").value.trim() || "Consulta particular";

    if (!name || !phone) {
      alert("Por favor completa tu nombre y WhatsApp.");
      return;
    }

    const token = Math.floor(1000 + Math.random() * 9000);
    const msg = `🩺 *SOLICITUD DE TURNO MÉDICO #${token}*
━━━━━━━━━━━━━━━━━━━━
👨‍⚕️ *Profesional:* ${selectedDoctor.name} (${selectedDoctor.specialty})
📅 *Fecha:* ${selectedDay.label}
⏰ *Horario:* ${selectedTime}
👤 *Paciente:* ${name}
📱 *WhatsApp:* ${phone}
📋 *Motivo / Cobertura:* ${reason}
━━━━━━━━━━━━━━━━━━━━
Hola! Acabo de reservar mi turno médico online. ¿Me confirman la reserva para agendarlo?`;

    const url = `https://wa.me/${CLINIC_CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");

    alert(`¡Turno reservado exitosamente para el ${selectedDay.label} a las ${selectedTime}! Abriendo WhatsApp para confirmación.`);
  });
}
