import type {
  AppData,
  CompletionRecord,
  DailyProgress,
  DailyRecord,
  MetricKey,
  RoutineBlock,
  RoutineDay,
  WeekMetrics,
  Weekday,
} from "../types";

export const WEEKDAY_ORDER: Weekday[] = [1, 2, 3, 4, 5];

const dayMeta: Record<Weekday, Omit<RoutineDay, "blocks">> = {
  1: { weekday: 1, label: "Lunes", shortLabel: "Lun", subtitle: "institucion educativa · EDUVO · Group A", accent: "red" },
  2: { weekday: 2, label: "Martes", shortLabel: "Mar", subtitle: "institucion educativa · EDUVO · institucion educativa", accent: "green" },
  3: { weekday: 3, label: "Miércoles", shortLabel: "Mié", subtitle: "institucion educativa · EDUVO · Group A", accent: "red" },
  4: { weekday: 4, label: "Jueves", shortLabel: "Jue", subtitle: "institucion educativa · EDUVO++ · Group B", accent: "violet" },
  5: { weekday: 5, label: "Viernes", shortLabel: "Vie", subtitle: "EDUVO · institucion educativa · review", accent: "blue" },
};

type BlockInput = Omit<RoutineBlock, "id">;

function block(id: string, input: BlockInput): RoutineBlock {
  return { id, ...input };
}

const sleep = (prefix: string): RoutineBlock =>
  block(`${prefix}-sleep`, {
    start: "00:00",
    end: "08:00",
    title: "Sueño",
    description: "Dormir · recuperación",
    icon: "bed",
    kind: "sleep",
    metric: "sleep",
  });

const morningBlock = (prefix: string, description = "Cama · planchar · desayuno · luz · ducha") =>
  block(`${prefix}-morning`, {
    start: "08:00",
    end: "09:20",
    title: "Rutina matutina",
    description,
    icon: "sun",
    kind: "health",
    tags: ["salud", "ancla"],
  });

const basicLateMorning = (prefix: string, eduvoTitle = "EDUVO Deep Work", eduvoDescription = "Producto · clientes · construcción") => [
  block(`${prefix}-institucion educativa-deep`, {
    start: "09:20",
    end: "10:50",
    title: "institucion educativa Deep Work",
    description: "Aprendizaje profundo · ejercicios · active recall",
    icon: "brain",
    kind: "institucion educativa",
    metric: "unamDeep",
    tags: ["prioridad", "aprendizaje real"],
  }),
  block(`${prefix}-break-1`, {
    start: "10:50",
    end: "11:05",
    title: "Descanso",
    description: "Pausa breve · volver a la siguiente ancla",
    icon: "coffee",
    kind: "break",
  }),
  block(`${prefix}-eduvo-primary`, {
    start: "11:05",
    end: "12:35",
    title: eduvoTitle,
    description: eduvoDescription,
    icon: "rocket",
    kind: "eduvo",
    metric: "eduvoPrimary",
    tags: ["output concreto"],
  }),
  block(`${prefix}-lunch-fast`, {
    start: "12:35",
    end: "13:05",
    title: "Comida rápida",
    description: "Comer · descansar · seguir",
    icon: "utensils",
    kind: "meal",
  }),
];

const mondayBlocks: RoutineBlock[] = [
  sleep("mon"),
  block("mon-rise", { start: "08:00", end: "08:10", title: "Levantar", description: "Cama · agua", icon: "sparkles", kind: "health" }),
  block("mon-iron", { start: "08:10", end: "08:25", title: "Planchar", description: "Dejar ropa lista", icon: "sparkles", kind: "health" }),
  block("mon-breakfast", { start: "08:25", end: "08:45", title: "Desayuno", description: "Medicación matutina según prescripción", icon: "coffee", kind: "meal", metric: "breakfast" }),
  block("mon-light", { start: "08:45", end: "08:55", title: "Luz exterior", description: "Patio · luz natural", icon: "sun", kind: "health", metric: "light" }),
  block("mon-shower", { start: "08:55", end: "09:15", title: "Ducha y arreglo", description: "Skincare · cabello · vestirse", icon: "droplets", kind: "health" }),
  block("mon-desk", { start: "09:15", end: "09:20", title: "Escritorio listo", description: "Abrir solo lo necesario", icon: "laptop", kind: "transition" }),
  ...basicLateMorning("mon", "EDUVO Deep Work", "Producto · clientes · software · agentes · entregable concreto"),
  block("mon-group-a-learn", { start: "13:05", end: "14:05", title: "Group A · Aprender", description: "Tema nuevo · entender · probar · notas · explicar", icon: "book", kind: "training", code: "Group A", stage: "learn" }),
  block("mon-reset-1", { start: "14:05", end: "14:15", title: "Reset", description: "Cerrar una etapa · preparar la siguiente", icon: "refresh", kind: "break" }),
  block("mon-group-a-execute", { start: "14:15", end: "14:40", title: "Group A · Ejecutar", description: "n8n · workflow · ejemplos · errores · clase preparada", icon: "laptop", kind: "training", code: "Group A", stage: "execute" }),
  block("mon-gym-ready", { start: "14:40", end: "14:55", title: "Gym listo", description: "Bolsa · ropa · salida", icon: "dumbbell", kind: "health" }),
  block("mon-family", { start: "14:55", end: "15:25", title: "Comida con mamá", description: "Comida familiar · presencia", icon: "users", kind: "meal", metric: "familyMeal" }),
  block("mon-gym", { start: "15:30", end: "18:40", title: "Viltrumite + cardio", description: "Entrenamiento · cardio · traslados", icon: "dumbbell", kind: "gym", metric: "gym", tags: ["ancla"] }),
  block("mon-shower-2", { start: "18:40", end: "19:10", title: "Reset post-gym", description: "Ducha · skincare · ropa limpia", icon: "droplets", kind: "health" }),
  block("mon-post-gym", { start: "19:10", end: "19:40", title: "Post-gym", description: "Comer · recuperar", icon: "apple", kind: "meal", metric: "postGym" }),
  block("mon-group-a-review", { start: "19:40", end: "20:20", title: "Group A · Repaso final", description: "Secuencia · demo · links · dudas", icon: "book", kind: "training", code: "Group A", stage: "review" }),
  block("mon-class", { start: "20:30", end: "22:00", title: "Clase Group A", description: "Llegar preparado · participar", icon: "graduation", kind: "class", code: "Group A", metric: "topClass" }),
  block("mon-capture", { start: "22:00", end: "22:15", title: "Capture", description: "Pendientes de mañana", icon: "pen", kind: "transition" }),
  block("mon-hygiene", { start: "22:15", end: "22:40", title: "Higiene nocturna", description: "Preparar mañana", icon: "droplets", kind: "health" }),
  block("mon-shutdown", { start: "22:40", end: "24:00", title: "Desconexión", description: "Fin absoluto de trabajo", icon: "moon", kind: "sleep", metric: "shutdown", tags: ["ancla"] }),
];

const tuesdayBlocks: RoutineBlock[] = [
  sleep("tue"),
  morningBlock("tue", "Cama → planchar → desayuno → luz → ducha / arreglo"),
  ...basicLateMorning("tue", "EDUVO", "Producto · clientes · construcción"),
  block("tue-institucion educativa", { start: "13:05", end: "14:05", title: "institucion educativa", description: "Materia actual · actividad · lectura · avance semanal", icon: "graduation", kind: "institucion educativa", metric: "institucion educativa" }),
  block("tue-break-2", { start: "14:05", end: "14:15", title: "Descanso", description: "Pausa breve", icon: "coffee", kind: "break" }),
  block("tue-group-b-prep", { start: "14:15", end: "14:35", title: "Training Group B", description: "Presentación · ejercicio · links", icon: "book", kind: "training", code: "Group B" }),
  block("tue-gym-ready", { start: "14:35", end: "14:55", title: "Gym listo", description: "Bolsa · ropa · salida", icon: "dumbbell", kind: "health" }),
  block("tue-family", { start: "14:55", end: "15:25", title: "Comida con mamá", description: "Comida familiar · presencia", icon: "users", kind: "meal", metric: "familyMeal" }),
  block("tue-gym", { start: "15:30", end: "18:40", title: "Gym + cardio", description: "Entrenamiento · cardio · traslados", icon: "dumbbell", kind: "gym", metric: "gym", tags: ["ancla"] }),
  block("tue-shower", { start: "18:40", end: "19:10", title: "Reset post-gym", description: "Ducha · ropa limpia", icon: "droplets", kind: "health" }),
  block("tue-post-gym", { start: "19:10", end: "19:40", title: "Post-gym", description: "Comer · recuperar", icon: "apple", kind: "meal", metric: "postGym" }),
  block("tue-institucion educativa-recall", { start: "19:40", end: "20:10", title: "institucion educativa Recall", description: "Flashcards · preguntas · 2–3 ejercicios", icon: "brain", kind: "institucion educativa", metric: "unamRecall" }),
  block("tue-top-ready", { start: "20:10", end: "20:20", title: "Training listo", description: "Abrir clase · agua · entrar", icon: "check", kind: "training", code: "Group B" }),
  block("tue-class", { start: "20:30", end: "22:00", title: "Clase Group B", description: "Llegar listo · tomar lo esencial", icon: "graduation", kind: "class", code: "Group B", metric: "topClass" }),
  block("tue-shutdown", { start: "22:00", end: "24:00", title: "Cierre nocturno", description: "Cierre · higiene · desconexión · dormir", icon: "moon", kind: "sleep", metric: "shutdown" }),
];

const wednesdayBlocks: RoutineBlock[] = [
  sleep("wed"),
  morningBlock("wed", "Cama · planchar · desayuno · luz · ducha / arreglo"),
  ...basicLateMorning("wed", "EDUVO", "Producto · clientes · construcción"),
  block("wed-group-a-learn", { start: "13:05", end: "14:05", title: "Group A · Aprender", description: "Tema nuevo · dominar concepto", icon: "book", kind: "training", code: "Group A", stage: "learn" }),
  block("wed-reset-1", { start: "14:05", end: "14:15", title: "Reset", description: "Cambiar de contexto", icon: "refresh", kind: "break" }),
  block("wed-group-a-execute", { start: "14:15", end: "14:40", title: "Group A · Ejecutar", description: "n8n · demo · errores · ejemplos", icon: "laptop", kind: "training", code: "Group A", stage: "execute" }),
  block("wed-gym-ready", { start: "14:40", end: "14:55", title: "Gym preparado", description: "Bolsa · ropa · salida", icon: "dumbbell", kind: "health" }),
  block("wed-family", { start: "14:55", end: "15:25", title: "Comida con mamá", description: "Comida familiar · presencia", icon: "users", kind: "meal", metric: "familyMeal" }),
  block("wed-gym", { start: "15:30", end: "18:40", title: "Gym + cardio", description: "Entrenamiento · cardio · traslados", icon: "dumbbell", kind: "gym", metric: "gym", tags: ["ancla"] }),
  block("wed-shower", { start: "18:40", end: "19:10", title: "Reset post-gym", description: "Ducha · skincare · ropa limpia", icon: "droplets", kind: "health" }),
  block("wed-post-gym", { start: "19:10", end: "19:40", title: "Post-gym", description: "Comer · recuperar", icon: "apple", kind: "meal", metric: "postGym" }),
  block("wed-group-a-review", { start: "19:40", end: "20:20", title: "Group A · Repaso final", description: "Secuencia · demo · links · dudas", icon: "book", kind: "training", code: "Group A", stage: "review" }),
  block("wed-class", { start: "20:30", end: "22:00", title: "Clase Group A", description: "Llegar preparado · participar", icon: "graduation", kind: "class", code: "Group A", metric: "topClass" }),
  block("wed-shutdown", { start: "22:00", end: "24:00", title: "Shutdown completo", description: "Cerrar · higiene · desconectar · dormir", icon: "moon", kind: "sleep", metric: "shutdown" }),
];

const thursdayBlocks: RoutineBlock[] = [
  sleep("thu"),
  morningBlock("thu", "Cama · planchar · desayuno · luz · ducha / arreglo"),
  ...basicLateMorning("thu", "EDUVO Deep Work", "Producto · clientes · software · entregable concreto"),
  block("thu-eduvo-extra", { start: "13:05", end: "14:05", title: "EDUVO Extra", description: "Producto estratégico · código · automatización · crecimiento", icon: "rocket", kind: "eduvo", metric: "eduvoOutput" }),
  block("thu-reset-1", { start: "14:05", end: "14:15", title: "Reset", description: "Cambiar de contexto", icon: "refresh", kind: "break" }),
  block("thu-top-check", { start: "14:15", end: "14:35", title: "Training", description: "Chequeo rápido únicamente", icon: "book", kind: "training", code: "Group B" }),
  block("thu-gym-ready", { start: "14:35", end: "14:55", title: "Gym listo", description: "Bolsa · ropa · salida", icon: "dumbbell", kind: "health" }),
  block("thu-family", { start: "14:55", end: "15:25", title: "Comida con mamá", description: "Comida familiar · presencia", icon: "users", kind: "meal", metric: "familyMeal" }),
  block("thu-gym", { start: "15:30", end: "18:40", title: "Gym", description: "Entrenamiento · cardio · traslados", icon: "dumbbell", kind: "gym", metric: "gym", tags: ["ancla"] }),
  block("thu-shower", { start: "18:40", end: "19:10", title: "Reset post-gym", description: "Ducha · ropa limpia", icon: "droplets", kind: "health" }),
  block("thu-post-gym", { start: "19:10", end: "19:40", title: "Post-gym", description: "Comer · recuperar", icon: "apple", kind: "meal", metric: "postGym" }),
  block("thu-institucion educativa-recall", { start: "19:40", end: "20:10", title: "institucion educativa Recall", description: "Flashcards · preguntas · ejercicios", icon: "brain", kind: "institucion educativa", metric: "unamRecall" }),
  block("thu-class-ready", { start: "20:10", end: "20:20", title: "Preparar clase", description: "Abrir links · entrar", icon: "check", kind: "training", code: "Group B" }),
  block("thu-class", { start: "20:30", end: "22:00", title: "Training Group B", description: "Clase · capturar lo esencial", icon: "graduation", kind: "class", code: "Group B", metric: "topClass" }),
  block("thu-shutdown", { start: "22:00", end: "24:00", title: "Cierre nocturno", description: "Cerrar · higiene · desconectar · dormir", icon: "moon", kind: "sleep", metric: "shutdown" }),
];

const fridayBlocks: RoutineBlock[] = [
  sleep("fri"),
  morningBlock("fri", "Cama · planchar · desayuno · luz · ducha / arreglo"),
  block("fri-institucion educativa-deep", { start: "09:20", end: "10:50", title: "institucion educativa · cierre semanal", description: "Cerrar aprendizaje académico de la semana", icon: "brain", kind: "institucion educativa", metric: "unamDeep", tags: ["prioridad"] }),
  block("fri-break-1", { start: "10:50", end: "11:05", title: "Descanso", description: "Pausa breve", icon: "coffee", kind: "break" }),
  block("fri-eduvo-primary", { start: "11:05", end: "12:35", title: "EDUVO", description: "Producto · clientes · construcción", icon: "rocket", kind: "eduvo", metric: "eduvoPrimary", tags: ["output concreto"] }),
  block("fri-lunch", { start: "12:35", end: "13:05", title: "Comida", description: "Comer · descansar", icon: "utensils", kind: "meal" }),
  block("fri-institucion educativa", { start: "13:05", end: "14:05", title: "institucion educativa", description: "Entregas · avance · lectura · próxima semana encaminada", icon: "graduation", kind: "institucion educativa", metric: "institucion educativa" }),
  block("fri-reset", { start: "14:05", end: "14:15", title: "Reset", description: "Cambiar de contexto", icon: "refresh", kind: "break" }),
  block("fri-eduvo-review", { start: "14:15", end: "14:40", title: "EDUVO · Weekly Review", description: "Clientes · producto · ingresos · backlog · siguiente movimiento", icon: "rocket", kind: "eduvo", metric: "eduvoOutput" }),
  block("fri-gym-ready", { start: "14:40", end: "14:55", title: "Gym listo", description: "Bolsa · ropa · salida", icon: "dumbbell", kind: "health" }),
  block("fri-family", { start: "14:55", end: "15:25", title: "Comida con mamá", description: "Comida familiar · presencia", icon: "users", kind: "meal", metric: "familyMeal" }),
  block("fri-gym", { start: "15:30", end: "18:40", title: "Gym + cardio", description: "Entrenamiento · cardio", icon: "dumbbell", kind: "gym", metric: "gym", tags: ["ancla"] }),
  block("fri-shower", { start: "18:40", end: "19:10", title: "Reset post-gym", description: "Ducha · ropa limpia", icon: "droplets", kind: "health" }),
  block("fri-dinner", { start: "19:10", end: "19:40", title: "Cena", description: "Comer · recuperar", icon: "utensils", kind: "meal", metric: "postGym" }),
  block("fri-flex", { start: "19:40", end: "20:40", title: "Flex", description: "institucion educativa · EDUVO · institucion educativa solamente si hace falta", icon: "focus", kind: "flex" }),
  block("fri-recovery", { start: "20:40", end: "22:30", title: "Familia · ocio · recuperación", description: "Nada urgente · recuperar energía", icon: "users", kind: "health" }),
  block("fri-slowdown", { start: "22:30", end: "24:00", title: "Desaceleración", description: "Bajar revoluciones · preparar sueño", icon: "moon", kind: "sleep", metric: "shutdown" }),
];

export const ROUTINE: Record<Weekday, RoutineDay> = {
  1: { ...dayMeta[1], accent: "blue", blocks: mondayBlocks },
  2: { ...dayMeta[2], blocks: tuesdayBlocks },
  3: { ...dayMeta[3], accent: "blue", blocks: wednesdayBlocks },
  4: { ...dayMeta[4], blocks: thursdayBlocks },
  5: { ...dayMeta[5], blocks: fridayBlocks },
};

export const UNAM_SUBJECTS = [
  "Cálculo",
  "Macroeconomía",
  "Teoría Consumidor/Productor",
  "Economía Política",
  "Contabilidad",
  "Historia Económica",
  "Otra",
] as const;

export const ANCHORS = [
  { time: "09:20", label: "institucion educativa", icon: "brain" as const },
  { time: "11:05", label: "EDUVO", icon: "rocket" as const },
  { time: "13:05", label: "Foco", icon: "focus" as const },
  { time: "15:30", label: "Gym", icon: "dumbbell" as const },
  { time: "20:30", label: "Clase", icon: "graduation" as const },
  { time: "22:15", label: "Shutdown", icon: "moon" as const },
  { time: "00:00", label: "Sueño", icon: "bed" as const },
];

export function dateKeyFromDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function dateFromKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

export function weekdayFromDate(date: Date): Weekday | null {
  const day = date.getDay();
  return day >= 1 && day <= 5 ? (day as Weekday) : null;
}

export function routineDayForDate(date: Date): RoutineDay | null {
  const weekday = weekdayFromDate(date);
  return weekday ? ROUTINE[weekday] : null;
}

export function routineDayForKey(dateKey: string): RoutineDay | null {
  return routineDayForDate(dateFromKey(dateKey));
}

export function timeToMinutes(time: string): number {
  if (time === "24:00") return 1440;
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function formatTime(time: string): string {
  return time === "24:00" ? "00:00" : time;
}

export function formatTimeRange(block: RoutineBlock): string {
  return `${formatTime(block.start)}–${formatTime(block.end)}`;
}

export function getRecord(data: AppData, dateKey: string): DailyRecord {
  return data.dailyRecords[dateKey] ?? { dateKey, blocks: {}, overrides: {} };
}

export function getBlocksForKey(dateKey: string, data: AppData): RoutineBlock[] {
  const day = routineDayForKey(dateKey);
  if (!day) return [];
  const record = getRecord(data, dateKey);
  return day.blocks
    .map((blockItem) => {
      const override = record.overrides[blockItem.id];
      return override
        ? {
            ...blockItem,
            ...override,
          }
        : blockItem;
    })
    .sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
}

export function getCompletion(record: Pick<DailyRecord, "blocks">, blockId: string): CompletionRecord {
  return record.blocks[blockId] ?? {};
}

export function isCompleted(record: Pick<DailyRecord, "blocks">, blockId: string): boolean {
  return Boolean(record.blocks[blockId]?.completedAt);
}

export function isSkipped(record: Pick<DailyRecord, "blocks">, blockId: string): boolean {
  return Boolean(record.blocks[blockId]?.skippedAt) && !isCompleted(record, blockId);
}

export function isHandled(record: Pick<DailyRecord, "blocks">, blockId: string): boolean {
  return isCompleted(record, blockId) || isSkipped(record, blockId);
}

export function getProgress(blocks: RoutineBlock[], record: DailyRecord): DailyProgress {
  const completed = blocks.filter((item) => isCompleted(record, item.id)).length;
  const skipped = blocks.filter((item) => isSkipped(record, item.id)).length;
  const total = blocks.length;
  return {
    completed,
    total,
    skipped,
    percentage: total ? Math.round((completed / total) * 100) : 0,
  };
}

export function getCurrentContext(blocks: RoutineBlock[], record: DailyRecord, now = new Date()) {
  if (!blocks.length) return { primary: null, next: null, active: false, finished: false };
  const minutes = now.getHours() * 60 + now.getMinutes();
  const active = blocks.find((item) => timeToMinutes(item.start) <= minutes && minutes < timeToMinutes(item.end));
  const upcoming = blocks.find((item) => timeToMinutes(item.start) > minutes && !isHandled(record, item.id));
  const primary = active ?? upcoming ?? blocks[blocks.length - 1];
  const next = blocks.find(
    (item) => timeToMinutes(item.start) >= timeToMinutes(primary.end) && item.id !== primary.id && !isHandled(record, item.id),
  ) ?? null;
  return {
    primary,
    next,
    active: Boolean(active),
    finished: !active && !upcoming && minutes >= timeToMinutes(blocks[blocks.length - 1].end),
  };
}

export function getWeekStart(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  result.setHours(12, 0, 0, 0);
  return result;
}

export function getWeekDates(anchor: Date): Date[] {
  const start = getWeekStart(anchor);
  return Array.from({ length: 5 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function countCompletedMetric(blocks: RoutineBlock[], record: DailyRecord, metric: MetricKey): boolean {
  return blocks.some((item) => item.metric === metric && isCompleted(record, item.id));
}

export function getWeekMetrics(dates: Date[], data: AppData): WeekMetrics {
  const daily = dates
    .map((date) => {
      const dateKey = dateKeyFromDate(date);
      const blocks = getBlocksForKey(dateKey, data);
      const progress = getProgress(blocks, getRecord(data, dateKey));
      const weekday = weekdayFromDate(date);
      return weekday ? { dateKey, weekday, ...progress } : null;
    })
    .filter((item): item is { dateKey: string; weekday: Weekday } & DailyProgress => Boolean(item));

  let sleep = 0;
  let unamDeep = 0;
  let unamRecall = 0;
  let eduvoSessions = 0;
  let gym = 0;
  let topClasses = 0;
  let institucion educativa = 0;
  let completedTotal = 0;
  let blockTotal = 0;
  const eduvoOutputs: WeekMetrics["eduvoOutputs"] = [];

  for (const day of daily) {
    const blocks = getBlocksForKey(day.dateKey, data);
    const record = getRecord(data, day.dateKey);
    completedTotal += day.completed;
    blockTotal += day.total;
    if (countCompletedMetric(blocks, record, "sleep")) sleep += 1;
    if (countCompletedMetric(blocks, record, "unamDeep")) unamDeep += 1;
    if (countCompletedMetric(blocks, record, "unamRecall")) unamRecall += 1;
    if (countCompletedMetric(blocks, record, "eduvoPrimary")) eduvoSessions += 1;
    if (countCompletedMetric(blocks, record, "gym")) gym += 1;
    if (countCompletedMetric(blocks, record, "topClass")) topClasses += 1;
    if (countCompletedMetric(blocks, record, "institucion educativa")) institucion educativa += 1;
    for (const item of blocks.filter((candidate) => candidate.kind === "eduvo")) {
      const output = record.blocks[item.id]?.eduvoOutput?.trim();
      if (output) eduvoOutputs.push({ dateKey: day.dateKey, title: item.title, output });
    }
  }

  return {
    daily,
    compliance: blockTotal ? Math.round((completedTotal / blockTotal) * 100) : 0,
    sleep,
    unamDeep,
    unamRecall,
    eduvoSessions,
    eduvoOutputs,
    gym,
    topClasses,
    institucion educativa,
  };
}

export function getStreak(data: AppData, fromDate = new Date()): number {
  const cursor = new Date(fromDate);
  cursor.setHours(12, 0, 0, 0);
  let streak = 0;
  for (let guard = 0; guard < 60; guard += 1) {
    const weekday = weekdayFromDate(cursor);
    if (weekday) {
      const dateKey = dateKeyFromDate(cursor);
      const blocks = getBlocksForKey(dateKey, data);
      const progress = getProgress(blocks, getRecord(data, dateKey));
      if (progress.completed >= Math.max(1, Math.ceil(progress.total * 0.5))) streak += 1;
      else if (streak > 0) break;
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function displayDate(date: Date): string {
  const text = new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "long" }).format(date);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function displayShortDate(date: Date): string {
  return new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short" }).format(date).replace(".", "");
}

export function displayWeekRange(dates: Date[]): string {
  if (!dates.length) return "";
  const start = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short" }).format(dates[0]).replace(".", "");
  const end = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", year: "numeric" }).format(dates[dates.length - 1]).replace(".", "");
  return `${start} – ${end}`;
}

