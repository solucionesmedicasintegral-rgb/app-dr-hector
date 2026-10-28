const items = $input.all();
const req = $('Normalizar Request APP').first().json;

const modalidad = String(req.modalidad || 'presencial').toLowerCase();
const duracionMin = Number(req.duracion || 60);

const TZ = '-06:00';
const now = new Date();

// Horarios permitidos
// 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado
const wh = {
  1: { start: 15, end: 20 },
  2: { start: 15, end: 20 },
  3: { start: 9,  end: 14 },
  4: { start: 15, end: 20 },
  5: { start: 9,  end: 14 },
  6: { start: 9,  end: 14 }
};

// ÚNICOS días donde permitimos virtual a las 20:00
const virtual20Days = new Set([1, 2, 4]);

const busy = [];

for (const item of items) {
  const j = item.json || {};

  const ss =
    j.consultation_schedules ||
    j['horarios de consulta'] ||
    j.horarios_de_consulta;

  // Nimbo
  if (Array.isArray(ss)) {
    for (const s of ss) {
      if(s.deleted_at||s.canceled===true||/cancel|deleted/i.test(String(s.status||'')))continue;
      const a = s.starts_at || s.comienza_en;
      const b = s.ends_at || s.termina_en;

      if (a && b) {
        busy.push({
          start: new Date(a),
          end: new Date(b)
        });
      }
    }
    continue;
  }

  if(j.status==='cancelled')continue;

  // Google Calendar - evento de todo el día
  if (j.start?.date && j.end?.date) {
    const a = new Date(`${j.start.date}T00:00:00${TZ}`);
    const b = new Date(`${j.end.date}T00:00:00${TZ}`);

    busy.push({
      start: a,
      end: new Date(b.getTime() - 1000)
    });

    continue;
  }

  // Google Calendar - evento con horario
  if (j.start?.dateTime && j.end?.dateTime) {
    busy.push({
      start: new Date(j.start.dateTime),
      end: new Date(j.end.dateTime)
    });
  }
}

const pad = n => String(n).padStart(2, '0');

const key = d =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const zoned = (k, h) =>
  new Date(`${k}T${pad(h)}:00:00${TZ}`);

const occupied = (a, b) =>
  busy.some(x => a < x.end && b > x.start);

const seen = new Set();
const pref = [];
const other = [];

function add(a, b, k, h, bucket) {
  // Nunca horarios pasados
  if (a <= now) return;

  // Nunca horarios ocupados
  if (occupied(a, b)) return;

  const id = `${k}-${h}`;

  if (seen.has(id)) return;

  seen.add(id);

  bucket.push({
    fecha: k,
    hora: `${pad(h)}:00`,
    inicio_iso: a.toISOString(),
    fin_iso: b.toISOString()
  });
}

for (let d = 0; d < 180; d++) {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  base.setDate(base.getDate() + d);

  const day = base.getDay();

  if (!wh[day]) continue;

  const k = key(base);
  const w = wh[day];

  // ========================================
  // VIRTUAL 20:00
  // SOLO LUNES, MARTES Y JUEVES
  // ========================================
  if (
    modalidad === 'virtual' &&
    virtual20Days.has(day) &&
    duracionMin <= 60
  ) {
    const a = zoned(k, 20);
    const b = new Date(a.getTime() + duracionMin * 60000);

    add(a, b, k, 20, pref);
  }

  // ========================================
  // HORARIO NORMAL DEL CONSULTORIO
  // ========================================
  const cierre = zoned(k, w.end);

  for (let h = w.start; h < w.end; h++) {
    const a = zoned(k, h);
    const b = new Date(a.getTime() + duracionMin * 60000);

    // Impide que una cita termine después del cierre
    if (b > cierre) continue;

    add(a, b, k, h, other);
  }
}

// Virtual prioriza 20:00 cuando realmente corresponde
const horarios = (
  modalidad === 'virtual'
    ? [...pref, ...other]
    : other
).slice(0, 90);

return [{
  json: {
    ok: true,
    modalidad,
    duracion: duracionMin,
    total_ocupados_detectados: busy.length,
    total_disponibles: horarios.length,
    horarios
  }
}];