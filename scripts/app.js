const STORAGE_KEY = "stude-dashboard-v1";
const defaultJournalFields = [
  {
    id: "food",
    label: "Alimentacao",
    placeholder: "Como voce comeu hoje?",
    rows: 2,
  },
  {
    id: "sleep",
    label: "Sono",
    placeholder: "Horas, qualidade, sonhos...",
    rows: 2,
  },
  {
    id: "love",
    label: "Afetivo / vida amorosa",
    placeholder: "Como voce esta se sentindo?",
    rows: 2,
  },
  {
    id: "progress",
    label: "Progresso geral",
    placeholder: "O que avancou nos estudos e na vida?",
    rows: 4,
  },
];

const noteCatalog = {
  humanas: [
    "Historia",
    "Geografia",
    "Portugues: analise",
    "Portugues: literatura",
    "Portugues: redacao",
    "Artes",
    "Filosofia",
    "Ingles",
  ],
  exatas: [
    "Matematica A",
    "Matematica B",
    "Fisica A",
    "Fisica B",
    "Fisica C",
    "Quimica A",
    "Quimica B",
    "Biologia A",
    "Biologia B",
  ],
  outras: [],
};

const noteCategoryLabels = {
  humanas: "Humanas",
  exatas: "Exatas",
  outras: "Outras",
};

const defaultNoteSubject = {
  category: "humanas",
  subject: "Historia",
};

const defaultState = {
  tasks: [
    {
      id: crypto.randomUUID(),
      title: "Revisar matematica discreta",
      column: "focus",
      time: "90 min",
    },
    {
      id: crypto.randomUUID(),
      title: "Resolver exercicios de fisica",
      column: "progress",
      time: "14:00",
    },
  ],
  journalFields: defaultJournalFields,
  journalEntries: [],
  videos: [],
  canvasByMonth: {},
  noteLibrary: {
    customOtherSubjects: [],
    activeSubjectKey: "humanas::Historia",
    subjects: {},
  },
};

const state = loadState();

const boardColumns = [
  { key: "focus", title: "Foco" },
  { key: "progress", title: "Em andamento" },
  { key: "done", title: "Concluido" },
];

const ui = {
  calendarGrid: document.querySelector("#calendarGrid"),
  calendarCanvas: document.querySelector("#calendarCanvas"),
  calendarLabel: document.querySelector("#calendarLabel"),
  prevMonth: document.querySelector("#prevMonth"),
  nextMonth: document.querySelector("#nextMonth"),
  toolMode: document.querySelector("#toolMode"),
  toolColor: document.querySelector("#toolColor"),
  toolSize: document.querySelector("#toolSize"),
  textStamp: document.querySelector("#textStamp"),
  saveCanvas: document.querySelector("#saveCanvas"),
  clearCanvas: document.querySelector("#clearCanvas"),
  taskBoard: document.querySelector("#taskBoard"),
  taskForm: document.querySelector("#taskForm"),
  taskTitle: document.querySelector("#taskTitle"),
  taskColumn: document.querySelector("#taskColumn"),
  taskTime: document.querySelector("#taskTime"),
  journalForm: document.querySelector("#journalForm"),
  journalDate: document.querySelector("#journalDate"),
  journalFieldName: document.querySelector("#journalFieldName"),
  addJournalField: document.querySelector("#addJournalField"),
  journalDynamicFields: document.querySelector("#journalDynamicFields"),
  journalEntries: document.querySelector("#journalEntries"),
  videoForm: document.querySelector("#videoForm"),
  videoSubject: document.querySelector("#videoSubject"),
  videoTopic: document.querySelector("#videoTopic"),
  videoLink: document.querySelector("#videoLink"),
  videoTags: document.querySelector("#videoTags"),
  videoSearch: document.querySelector("#videoSearch"),
  videoLibrary: document.querySelector("#videoLibrary"),
  humanasSubjects: document.querySelector("#humanasSubjects"),
  exatasSubjects: document.querySelector("#exatasSubjects"),
  outrasSubjects: document.querySelector("#outrasSubjects"),
  otherSubjectName: document.querySelector("#otherSubjectName"),
  addOtherSubject: document.querySelector("#addOtherSubject"),
  activeSubjectTitle: document.querySelector("#activeSubjectTitle"),
  activeSubjectMeta: document.querySelector("#activeSubjectMeta"),
  activeTopicTitle: document.querySelector("#activeTopicTitle"),
  subjectTopicSelect: document.querySelector("#subjectTopicSelect"),
  newTopicName: document.querySelector("#newTopicName"),
  addSubjectTopic: document.querySelector("#addSubjectTopic"),
  deleteSubjectTopic: document.querySelector("#deleteSubjectTopic"),
  mapNodeTitle: document.querySelector("#mapNodeTitle"),
  mapNodeColor: document.querySelector("#mapNodeColor"),
  addMapNode: document.querySelector("#addMapNode"),
  mapStage: document.querySelector("#mapStage"),
  mapViewport: document.querySelector("#mapViewport"),
  mapPlane: document.querySelector("#mapPlane"),
  mapConnections: document.querySelector("#mapConnections"),
  mapSketchCanvas: document.querySelector("#mapSketchCanvas"),
  exactSketchTools: document.querySelector("#exactSketchTools"),
  noteSketchMode: document.querySelector("#noteSketchMode"),
  noteSketchColor: document.querySelector("#noteSketchColor"),
  noteSketchSize: document.querySelector("#noteSketchSize"),
  saveNoteSketch: document.querySelector("#saveNoteSketch"),
  clearNoteSketch: document.querySelector("#clearNoteSketch"),
  zoomOutMap: document.querySelector("#zoomOutMap"),
  zoomInMap: document.querySelector("#zoomInMap"),
  resetMapZoom: document.querySelector("#resetMapZoom"),
  toggleMapFullscreen: document.querySelector("#toggleMapFullscreen"),
  mapConnectionStatus: document.querySelector("#mapConnectionStatus"),
  noteMatchStatus: document.querySelector("#noteMatchStatus"),
  noteTitle: document.querySelector("#noteTitle"),
  noteFontFamily: document.querySelector("#noteFontFamily"),
  noteFontSize: document.querySelector("#noteFontSize"),
  noteEditor: document.querySelector("#noteEditor"),
  saveSubjectNote: document.querySelector("#saveSubjectNote"),
  subjectNotesList: document.querySelector("#subjectNotesList"),
  formatActions: document.querySelectorAll(".format-action"),
  metricTasks: document.querySelector("#metricTasks"),
  metricEntries: document.querySelector("#metricEntries"),
  metricVideos: document.querySelector("#metricVideos"),
  todayFocus: document.querySelector("#todayFocus"),
  taskColumnTemplate: document.querySelector("#taskColumnTemplate"),
};

let visibleMonth = new Date();
visibleMonth.setDate(1);

let drawing = false;
let currentStroke = [];
let draggedTaskId = null;

const canvas = ui.calendarCanvas;
const ctx = canvas ? canvas.getContext("2d") : null;
const mapSketchCanvas = ui.mapSketchCanvas;
const mapSketchCtx = mapSketchCanvas ? mapSketchCanvas.getContext("2d") : null;

let activeMapNodeId = null;
let draggedMapNode = null;
let mapSketchDrawing = false;
let editingSubjectNoteId = null;
let pendingConnectionSourceId = null;
let resizingMapNode = null;
const DEFAULT_TOPIC_ID = "geral";
const DEFAULT_MAP_WIDTH = 2800;
const DEFAULT_MAP_HEIGHT = 1800;

if (ui.journalDate) {
  ui.journalDate.value = formatDateInput(new Date());
}

renderAll();
attachEvents();

function loadState() {
  try {
    const raw = readStoredState();
    if (!raw) {
      return structuredClone(defaultState);
    }

    const parsed = { ...defaultState, ...JSON.parse(raw) };
    parsed.journalFields = normalizeJournalFields(parsed.journalFields);
    parsed.journalEntries = normalizeJournalEntries(parsed.journalEntries, parsed.journalFields);
    parsed.noteLibrary = normalizeNoteLibrary(parsed.noteLibrary);
    return parsed;
  } catch (error) {
    console.warn("Nao foi possivel carregar os dados locais.", error);
    return structuredClone(defaultState);
  }
}

function saveState() {
  writeStoredState(JSON.stringify(state));
  updateSummary();
}

function attachEvents() {
  if (ui.prevMonth && ui.nextMonth && ui.saveCanvas && ui.clearCanvas && canvas) {
    ui.prevMonth.addEventListener("click", () => {
      visibleMonth.setMonth(visibleMonth.getMonth() - 1);
      renderCalendar();
    });

    ui.nextMonth.addEventListener("click", () => {
      visibleMonth.setMonth(visibleMonth.getMonth() + 1);
      renderCalendar();
    });

    ui.saveCanvas.addEventListener("click", saveCanvasForCurrentMonth);
    ui.clearCanvas.addEventListener("click", clearCurrentMonthCanvas);

    canvas.addEventListener("pointerdown", onCanvasPointerDown);
    canvas.addEventListener("pointermove", onCanvasPointerMove);
    canvas.addEventListener("pointerup", onCanvasPointerUp);
    canvas.addEventListener("pointerleave", onCanvasPointerUp);
    canvas.addEventListener("pointercancel", onCanvasPointerUp);
  }

  if (ui.taskForm) {
    ui.taskForm.addEventListener("submit", (event) => {
      event.preventDefault();

    state.tasks.unshift({
      id: crypto.randomUUID(),
      title: ui.taskTitle.value.trim(),
      column: ui.taskColumn.value,
      time: ui.taskTime.value.trim() || "Sem horario",
    });

    ui.taskForm.reset();
    ui.taskColumn.value = "focus";
    renderTasks();
    saveState();
    });
  }

  if (ui.journalForm) {
    ui.journalForm.addEventListener("submit", (event) => {
      event.preventDefault();

    const values = {};
    state.journalFields.forEach((field) => {
      const input = ui.journalDynamicFields.querySelector(`[data-field-id="${field.id}"]`);
      values[field.id] = input?.value.trim() ?? "";
    });

    state.journalEntries.unshift({
      id: crypto.randomUUID(),
      date: ui.journalDate.value,
      values,
    });

    ui.journalForm.reset();
    ui.journalDate.value = formatDateInput(new Date());
    renderJournalFields();
    renderJournal();
    saveState();
    });
  }

  if (ui.addJournalField) {
    ui.addJournalField.addEventListener("click", () => {
      const label = ui.journalFieldName.value.trim();
    if (!label) {
      return;
    }

    state.journalFields.push({
      id: createFieldId(label),
      label,
      placeholder: `Escreva sobre ${label.toLowerCase()}`,
      rows: 2,
    });

    ui.journalFieldName.value = "";
    renderJournalFields();
    saveState();
    });
  }

  if (ui.addOtherSubject) {
    ui.addOtherSubject.addEventListener("click", () => {
      const name = ui.otherSubjectName.value.trim();
    if (!name) {
      return;
    }

    if (!state.noteLibrary.customOtherSubjects.includes(name)) {
      state.noteLibrary.customOtherSubjects.push(name);
    }

    const key = getSubjectKey("outras", name);
    ensureSubjectState(key, "outras", name);
    state.noteLibrary.activeSubjectKey = key;
    pendingConnectionSourceId = null;
    ui.otherSubjectName.value = "";
    renderNotesLibrary();
    saveState();
    });
  }

  if (ui.subjectTopicSelect) {
    ui.subjectTopicSelect.addEventListener("change", () => {
      const subjectState = getActiveSubjectState();
    subjectState.activeTopicId = ui.subjectTopicSelect.value;
    activeMapNodeId = null;
    pendingConnectionSourceId = null;
    renderNotesLibrary();
    saveState();
    });
  }

  if (ui.addSubjectTopic) {
    ui.addSubjectTopic.addEventListener("click", () => {
      const name = ui.newTopicName.value.trim();
    if (!name) {
      return;
    }
    const subjectState = getActiveSubjectState();
    const topicId = createTopicId(subjectState, name);
    subjectState.topics.push({
      id: topicId,
      name,
      mapZoom: 1,
      mapSize: { width: DEFAULT_MAP_WIDTH, height: DEFAULT_MAP_HEIGHT },
      nodes: [],
      notes: [],
      connections: [],
      sketch: "",
    });
    subjectState.activeTopicId = topicId;
    ui.newTopicName.value = "";
    activeMapNodeId = null;
    pendingConnectionSourceId = null;
    renderNotesLibrary();
    saveState();
    });
  }

  if (ui.deleteSubjectTopic) {
    ui.deleteSubjectTopic.addEventListener("click", () => {
      const subjectState = getActiveSubjectState();
      if (subjectState.topics.length <= 1) {
        return;
      }

      const topicToDelete = getActiveTopicState();
      subjectState.topics = subjectState.topics.filter((topic) => topic.id !== topicToDelete.id);
      subjectState.activeTopicId = subjectState.topics[0].id;
      activeMapNodeId = null;
      pendingConnectionSourceId = null;
      renderNotesLibrary();
      saveState();
    });
  }

  if (ui.addMapNode) {
    ui.addMapNode.addEventListener("click", () => {
      const title = ui.mapNodeTitle.value.trim();
    if (!title) {
      return;
    }

    const topicState = getActiveTopicState();
    topicState.nodes.push({
      id: crypto.randomUUID(),
      title,
      color: ui.mapNodeColor.value,
      image: "",
      content: "",
      x: 120 + topicState.nodes.length * 24,
      y: 120 + topicState.nodes.length * 24,
      width: 220,
      height: 150,
    });
    activeMapNodeId = topicState.nodes[topicState.nodes.length - 1].id;
    ui.mapNodeTitle.value = "";
    ui.mapNodeColor.value = "#fff7ed";
    renderMapWorkspace();
    saveState();
    });
  }

  if (ui.saveSubjectNote) {
    ui.saveSubjectNote.addEventListener("click", saveSubjectNote);
  }

  document.querySelectorAll(".notes-category-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      const list = button.nextElementSibling;
      list?.classList.toggle("hidden");
      const addBox = list?.nextElementSibling;
      if (addBox?.classList.contains("notes-subject-add")) {
        addBox.classList.toggle("hidden");
      }
    });
  });

  ui.formatActions.forEach((button) => {
    button.addEventListener("click", () => {
      if (!ui.noteEditor) {
        return;
      }
      const command = button.dataset.command;
      const value = button.dataset.value ?? null;
      ui.noteEditor.focus();
      document.execCommand(command, false, value);
    });
  });

  if (ui.noteFontFamily && ui.noteEditor) {
    ui.noteFontFamily.addEventListener("change", () => {
      ui.noteEditor.style.fontFamily = ui.noteFontFamily.value;
    });
  }

  if (ui.noteFontSize && ui.noteEditor) {
    ui.noteFontSize.addEventListener("input", () => {
      ui.noteEditor.style.fontSize = `${ui.noteFontSize.value}px`;
    });
  }

  if (ui.noteTitle) {
    ui.noteTitle.addEventListener("input", renderNoteMatchStatus);
  }

  if (mapSketchCanvas && ui.saveNoteSketch && ui.clearNoteSketch) {
    mapSketchCanvas.addEventListener("pointerdown", onMapSketchPointerDown);
    mapSketchCanvas.addEventListener("pointermove", onMapSketchPointerMove);
    mapSketchCanvas.addEventListener("pointerup", onMapSketchPointerUp);
    mapSketchCanvas.addEventListener("pointerleave", onMapSketchPointerUp);
    mapSketchCanvas.addEventListener("pointercancel", onMapSketchPointerUp);

    ui.saveNoteSketch.addEventListener("click", saveMapSketch);
    ui.clearNoteSketch.addEventListener("click", clearMapSketch);
  }

  if (ui.zoomOutMap && ui.zoomInMap && ui.resetMapZoom) {
    ui.zoomOutMap.addEventListener("click", () => adjustMapZoom(-0.1));
    ui.zoomInMap.addEventListener("click", () => adjustMapZoom(0.1));
    ui.resetMapZoom.addEventListener("click", resetMapZoom);
  }

  if (ui.toggleMapFullscreen && ui.mapStage) {
    ui.toggleMapFullscreen.addEventListener("click", toggleMapFullscreen);
    document.addEventListener("fullscreenchange", updateFullscreenButtonLabel);
  }

  if (ui.videoForm) {
    ui.videoForm.addEventListener("submit", (event) => {
      event.preventDefault();

    state.videos.unshift({
      id: crypto.randomUUID(),
      subject: ui.videoSubject.value.trim(),
      topic: ui.videoTopic.value.trim(),
      link: ui.videoLink.value.trim(),
      tags: ui.videoTags.value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      createdAt: new Date().toISOString(),
    });

    ui.videoForm.reset();
    renderVideos();
    saveState();
    });
  }

  if (ui.videoSearch) {
    ui.videoSearch.addEventListener("input", renderVideos);
  }

  window.addEventListener("resize", () => {
    if (canvas) {
      resizeCanvas();
      loadCanvasForCurrentMonth();
    }
    if (mapSketchCanvas) {
      resizeMapSketchCanvas();
      loadMapSketch();
    }
  });

  window.addEventListener("pagehide", () => {
    if (canvas) {
      saveCanvasForCurrentMonth();
    }
    saveState();
  });
}

function renderAll() {
  if (ui.calendarGrid && canvas) {
    renderCalendar();
  }
  if (ui.taskBoard) {
    renderTasks();
  }
  if (ui.journalDynamicFields) {
    renderJournalFields();
  }
  if (ui.journalEntries) {
    renderJournal();
  }
  if (ui.videoLibrary) {
    renderVideos();
  }
  if (ui.mapPlane && ui.subjectNotesList) {
    renderNotesLibrary();
  }
  updateSummary();
}

function renderCalendar() {
  if (!ui.calendarGrid || !canvas || !ctx) {
    return;
  }
  const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay();
  const totalCells = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7;
  const today = new Date();

  ui.calendarLabel.textContent = visibleMonth.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  ui.calendarGrid.innerHTML = "";

  weekdays.forEach((weekday) => {
    const cell = document.createElement("div");
    cell.className = "calendar-weekday";
    cell.textContent = weekday;
    ui.calendarGrid.appendChild(cell);
  });

  for (let index = 0; index < totalCells; index += 1) {
    const dayNumber = index - startOffset + 1;
    const cellDate = new Date(year, month, dayNumber);
    const isCurrentMonth = cellDate.getMonth() === month;
    const isToday =
      cellDate.getDate() === today.getDate() &&
      cellDate.getMonth() === today.getMonth() &&
      cellDate.getFullYear() === today.getFullYear();

    const cell = document.createElement("div");
    cell.className = `calendar-day${isCurrentMonth ? "" : " muted"}${
      isToday ? " today" : ""
    }`;
    cell.innerHTML = `<strong>${cellDate.getDate()}</strong>`;
    ui.calendarGrid.appendChild(cell);
  }

  resizeCanvas();
  loadCanvasForCurrentMonth();
}

function resizeCanvas() {
  if (!canvas || !ctx) {
    return;
  }
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = rect.width * ratio;
  canvas.height = rect.height * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function onCanvasPointerDown(event) {
  if (!canvas || !ctx) {
    return;
  }
  const tool = ui.toolMode.value;
  const point = getCanvasPoint(event);

  if (tool === "text") {
    const value = ui.textStamp.value.trim();
    if (!value) {
      return;
    }
    ctx.fillStyle = ui.toolColor.value;
    ctx.font = `700 ${Math.max(Number(ui.toolSize.value) * 4, 18)}px Space Grotesk`;
    ctx.fillText(value, point.x, point.y);
    saveCanvasForCurrentMonth();
    return;
  }

  drawing = true;
  currentStroke = [point];
  canvas.setPointerCapture(event.pointerId);
}

function onCanvasPointerMove(event) {
  if (!ctx) {
    return;
  }
  if (!drawing) {
    return;
  }

  const point = getCanvasPoint(event);
  const previous = currentStroke[currentStroke.length - 1];
  currentStroke.push(point);

  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = Number(ui.toolSize.value);

  if (ui.toolMode.value === "eraser") {
    ctx.globalCompositeOperation = "destination-out";
  } else {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = ui.toolColor.value;
  }

  ctx.beginPath();
  ctx.moveTo(previous.x, previous.y);
  ctx.lineTo(point.x, point.y);
  ctx.stroke();
}

function onCanvasPointerUp(event) {
  if (!canvas || !ctx) {
    return;
  }
  if (!drawing) {
    return;
  }

  drawing = false;
  currentStroke = [];
  canvas.releasePointerCapture(event.pointerId);
  ctx.globalCompositeOperation = "source-over";
  saveCanvasForCurrentMonth();
}

function getCanvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function saveCanvasForCurrentMonth() {
  if (!canvas) {
    return;
  }
  state.canvasByMonth[getMonthKey()] = canvas.toDataURL("image/png");
  saveState();
}

function loadCanvasForCurrentMonth() {
  if (!ctx || !canvas) {
    return;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const saved = state.canvasByMonth[getMonthKey()];

  if (!saved) {
    return;
  }

  const image = new Image();
  image.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.clientWidth, canvas.clientHeight);
  };
  image.src = saved;
}

function clearCurrentMonthCanvas() {
  if (!ctx || !canvas) {
    return;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  delete state.canvasByMonth[getMonthKey()];
  saveState();
}

function getMonthKey() {
  return `${visibleMonth.getFullYear()}-${String(
    visibleMonth.getMonth() + 1
  ).padStart(2, "0")}`;
}

function renderTasks() {
  if (!ui.taskBoard || !ui.taskColumnTemplate) {
    return;
  }
  ui.taskBoard.innerHTML = "";

  boardColumns.forEach((column) => {
    const fragment = ui.taskColumnTemplate.content.cloneNode(true);
    const title = fragment.querySelector(".column-title");
    const count = fragment.querySelector(".column-count");
    const list = fragment.querySelector(".task-list");
    const tasks = state.tasks.filter((task) => task.column === column.key);

    title.textContent = column.title;
    count.textContent = `${tasks.length}`;

    list.addEventListener("dragover", (event) => event.preventDefault());
    list.addEventListener("drop", () => {
      if (!draggedTaskId) {
        return;
      }
      const task = state.tasks.find((item) => item.id === draggedTaskId);
      if (!task) {
        return;
      }
      task.column = column.key;
      draggedTaskId = null;
      renderTasks();
      saveState();
    });

    if (!tasks.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "Solte uma atividade aqui.";
      list.appendChild(empty);
    }

    tasks.forEach((task) => {
      const card = document.createElement("article");
      card.className = "task-card";
      card.draggable = true;
      card.innerHTML = `
        <div class="task-meta">
          <span>${escapeHtml(labelForColumn(task.column))}</span>
          <span>${escapeHtml(task.time)}</span>
        </div>
        <p>${escapeHtml(task.title)}</p>
        <div class="card-actions">
          <button class="inline-remove" type="button">Remover</button>
        </div>
      `;

      card.addEventListener("dragstart", () => {
        draggedTaskId = task.id;
      });

      card.querySelector(".inline-remove").addEventListener("click", () => {
        state.tasks = state.tasks.filter((item) => item.id !== task.id);
        renderTasks();
        saveState();
      });

      list.appendChild(card);
    });

    ui.taskBoard.appendChild(fragment);
  });

  updateTodayFocus();
}

function renderJournal() {
  if (!ui.journalEntries) {
    return;
  }
  ui.journalEntries.innerHTML = "";
  const entries = [...state.journalEntries].sort((a, b) => b.date.localeCompare(a.date));

  if (!entries.length) {
    ui.journalEntries.innerHTML =
      '<div class="empty-state">Seu diario aparece aqui conforme voce salva suas entradas.</div>';
    return;
  }

  entries.forEach((entry) => {
    const article = document.createElement("article");
    article.className = "journal-entry";
    article.innerHTML = `
      <div class="entry-date">${escapeHtml(formatDateLong(entry.date))}</div>
      <h4>Resumo do dia</h4>
      <div class="journal-topics"></div>
      <div class="card-actions">
        <button class="inline-remove" type="button">Remover</button>
      </div>
    `;
    const topics = article.querySelector(".journal-topics");
    state.journalFields.forEach((field) => {
      const line = document.createElement("p");
      line.innerHTML = `<strong>${escapeHtml(field.label)}:</strong> ${escapeHtml(
        sanitizeText(entry.values?.[field.id])
      )}`;
      topics.appendChild(line);
    });
    article.querySelector(".inline-remove").addEventListener("click", () => {
      state.journalEntries = state.journalEntries.filter((item) => item.id !== entry.id);
      renderJournal();
      saveState();
    });
    ui.journalEntries.appendChild(article);
  });
}

function renderJournalFields() {
  if (!ui.journalDynamicFields) {
    return;
  }
  ui.journalDynamicFields.innerHTML = "";

  state.journalFields.forEach((field, index) => {
    const wrapper = document.createElement("label");
    wrapper.className = "journal-field-card";

    wrapper.innerHTML = `
      <div class="journal-field-header">
        <span>${escapeHtml(field.label)}</span>
        ${
          state.journalFields.length > 1
            ? '<button class="inline-remove" type="button">Remover topico</button>'
            : ""
        }
      </div>
      <textarea
        data-field-id="${escapeHtml(field.id)}"
        rows="${field.rows ?? 2}"
        placeholder="${escapeHtml(field.placeholder || `Escreva sobre ${field.label}`)}"
      ></textarea>
    `;

    const removeButton = wrapper.querySelector(".inline-remove");
    if (removeButton) {
      removeButton.addEventListener("click", () => {
        removeJournalField(index);
      });
    }

    ui.journalDynamicFields.appendChild(wrapper);
  });
}

function renderVideos() {
  if (!ui.videoLibrary || !ui.videoSearch) {
    return;
  }
  ui.videoLibrary.innerHTML = "";
  const query = ui.videoSearch.value.trim().toLowerCase();
  const videos = [...state.videos]
    .filter((video) => {
      const haystack = `${video.subject} ${video.topic} ${video.tags.join(" ")}`.toLowerCase();
      return haystack.includes(query);
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  if (!videos.length) {
    ui.videoLibrary.innerHTML =
      '<div class="empty-state">Cadastre seus videos para montar sua propria biblioteca Feynman.</div>';
    return;
  }

  videos.forEach((video) => {
    const article = document.createElement("article");
    article.className = "video-card";
    article.innerHTML = `
      <p class="video-subject">${escapeHtml(video.subject)}</p>
      <h4>${escapeHtml(video.topic)}</h4>
      <p>Adicionado em ${escapeHtml(
        new Date(video.createdAt).toLocaleDateString("pt-BR")
      )}</p>
    `;

    if (video.tags.length) {
      const tags = document.createElement("div");
      tags.className = "video-tags";
      video.tags.forEach((tag) => {
        const chip = document.createElement("span");
        chip.textContent = tag;
        tags.appendChild(chip);
      });
      article.appendChild(tags);
    }

    if (video.link) {
      const link = document.createElement("a");
      link.className = "video-link";
      link.href = video.link;
      link.target = "_blank";
      link.rel = "noreferrer";
      link.textContent = "Abrir video";
      article.appendChild(link);
    }

    const actions = document.createElement("div");
    actions.className = "card-actions";
    const removeButton = document.createElement("button");
    removeButton.className = "inline-remove";
    removeButton.type = "button";
    removeButton.textContent = "Remover";
    removeButton.addEventListener("click", () => {
      state.videos = state.videos.filter((item) => item.id !== video.id);
      renderVideos();
      saveState();
    });
    actions.appendChild(removeButton);
    article.appendChild(actions);

    ui.videoLibrary.appendChild(article);
  });
}

function renderNotesLibrary() {
  if (!ui.mapPlane || !ui.subjectNotesList || !ui.subjectTopicSelect) {
    return;
  }
  renderSubjectCategory("humanas", ui.humanasSubjects);
  renderSubjectCategory("exatas", ui.exatasSubjects);
  renderSubjectCategory("outras", ui.outrasSubjects);
  renderTopicSelector();
  renderMapWorkspace();
  renderSubjectNotes();
  resetNoteEditor();
}

function renderTopicSelector() {
  if (!ui.subjectTopicSelect || !ui.activeTopicTitle) {
    return;
  }
  const subjectState = getActiveSubjectState();
  const activeTopic = getActiveTopicState();
  ui.subjectTopicSelect.innerHTML = "";

  subjectState.topics.forEach((topic) => {
    const option = document.createElement("option");
    option.value = topic.id;
    option.textContent = topic.name;
    option.selected = topic.id === subjectState.activeTopicId;
    ui.subjectTopicSelect.appendChild(option);
  });

  ui.activeTopicTitle.textContent = activeTopic.name;
  if (ui.deleteSubjectTopic) {
    ui.deleteSubjectTopic.disabled = subjectState.topics.length <= 1;
  }
}

function renderSubjectCategory(category, container) {
  if (!container) {
    return;
  }
  container.innerHTML = "";
  const subjects = getSubjectsForCategory(category);

  subjects.forEach((subject) => {
    const key = getSubjectKey(category, subject);
    ensureSubjectState(key, category, subject);

    const button = document.createElement("button");
    button.type = "button";
    button.className = `subject-chip${
      state.noteLibrary.activeSubjectKey === key ? " active" : ""
    }`;
    button.textContent = subject;
    button.addEventListener("click", () => {
      state.noteLibrary.activeSubjectKey = key;
      activeMapNodeId = null;
      pendingConnectionSourceId = null;
      renderNotesLibrary();
      saveState();
    });
    container.appendChild(button);
  });
}

function renderMapWorkspace() {
  if (!ui.mapPlane || !ui.mapViewport || !ui.mapConnectionStatus) {
    return;
  }
  const subject = getActiveSubject();
  const topicState = getActiveTopicState();
  const zoom = topicState.mapZoom;

  ui.activeSubjectTitle.textContent = subject.subject;
  ui.activeSubjectMeta.textContent = `${noteCategoryLabels[subject.category]} • ${
    subject.category === "exatas"
      ? "mapa, anotacoes com ligacao por nome e rabisco para formulas"
      : "mapa, anotacoes com ligacao por nome e rabisco livre"
  }`;
  ui.mapConnectionStatus.textContent = pendingConnectionSourceId
    ? "Escolha a segunda caixa para completar a corda, ou clique novamente para cancelar."
    : `Clique em "Conectar" em duas caixas para criar uma corda. Clique na corda para desconectar. Zoom: ${Math.round(
        zoom * 100
      )}%.`;

  ui.mapPlane.innerHTML = "";
  ui.mapViewport.style.width = `${topicState.mapSize.width * zoom}px`;
  ui.mapViewport.style.height = `${topicState.mapSize.height * zoom}px`;
  ui.mapPlane.style.width = `${topicState.mapSize.width}px`;
  ui.mapPlane.style.height = `${topicState.mapSize.height}px`;
  ui.mapPlane.style.transform = `scale(${zoom})`;
  ui.mapPlane.appendChild(ui.mapConnections);
  ui.mapPlane.appendChild(ui.mapSketchCanvas);

  if (!topicState.nodes.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.style.position = "absolute";
    empty.style.top = "40px";
    empty.style.left = "40px";
    empty.textContent =
      "Crie caixas para montar seu mapa desta materia.";
    ui.mapPlane.appendChild(empty);
  }

  topicState.nodes.forEach((node) => {
    const hasPendingSource = Boolean(pendingConnectionSourceId);
    const isConnectedToPending =
      hasPendingSource &&
      pendingConnectionSourceId !== node.id &&
      areNodesConnected(pendingConnectionSourceId, node.id);

    const element = document.createElement("article");
    element.className = `map-node${activeMapNodeId === node.id ? " active" : ""}${
      pendingConnectionSourceId === node.id ? " pending-link" : ""
    }`;
    element.style.left = `${node.x}px`;
    element.style.top = `${node.y}px`;
    element.style.width = `${node.width}px`;
    element.style.height = `${node.height}px`;
    element.style.setProperty("--node-color", node.color || "#fff7ed");
    element.dataset.nodeId = node.id;
    const linkedNotes = getNotesLinkedToNode(node);
    element.innerHTML = `
      <div class="map-node-header">
        <div>
          <strong>${escapeHtml(node.title)}</strong>
          <span>${escapeHtml(linkedNotes.length ? `${linkedNotes.length} anotacao(oes) ligada(s)` : "Sem anotacao ligada")}</span>
        </div>
        <button class="inline-remove" type="button">Remover</button>
      </div>
      <div class="map-node-body">${escapeHtml(
        node.content || linkedNotes[0]?.title || "Sem anotacao ligada ainda."
      )}</div>
      ${
        node.image
          ? `<img class="map-node-image" src="${escapeAttribute(node.image)}" alt="${escapeAttribute(
              node.title
            )}" />`
          : ""
      }
      <div class="map-node-actions">
        <button class="ghost-button map-focus-note" type="button">Ver anotacao</button>
        <button class="ghost-button map-connect-node" type="button">${
          pendingConnectionSourceId === node.id
            ? "Cancelar ligacao"
            : isConnectedToPending
              ? "Desconectar"
              : "Conectar"
        }</button>
        <button class="ghost-button map-edit-node" type="button">Editar caixa</button>
      </div>
      <div class="map-node-resize" title="Redimensionar caixa"></div>
    `;

    element.addEventListener("pointerdown", (event) => {
      if (event.target.closest("button")) {
        return;
      }

      activeMapNodeId = node.id;
      draggedMapNode = {
        id: node.id,
        offsetX: event.clientX + ui.mapStage.scrollLeft - node.x * zoom,
        offsetY: event.clientY + ui.mapStage.scrollTop - node.y * zoom,
      };
      element.setPointerCapture(event.pointerId);
      renderSubjectNotes();
      highlightActiveMapNode();
    });

    element.addEventListener("pointermove", (event) => {
      if (!draggedMapNode || draggedMapNode.id !== node.id) {
        return;
      }

      node.x = (event.clientX + ui.mapStage.scrollLeft - draggedMapNode.offsetX) / zoom;
      node.y = (event.clientY + ui.mapStage.scrollTop - draggedMapNode.offsetY) / zoom;
      element.style.left = `${Math.max(0, node.x)}px`;
      element.style.top = `${Math.max(0, node.y)}px`;
      renderMapConnections();
      maybeGrowMapToFit(node);
    });

    element.addEventListener("pointerup", (event) => {
      if (draggedMapNode?.id === node.id) {
        node.x = Math.max(0, node.x);
        node.y = Math.max(0, node.y);
        draggedMapNode = null;
        saveState();
      }
      if (element.hasPointerCapture(event.pointerId)) {
        element.releasePointerCapture(event.pointerId);
      }
    });

    element.querySelector(".inline-remove").addEventListener("click", () => {
      topicState.nodes = topicState.nodes.filter((item) => item.id !== node.id);
      topicState.connections = topicState.connections.filter(
        (connection) => connection.from !== node.id && connection.to !== node.id
      );
      if (activeMapNodeId === node.id) {
        activeMapNodeId = null;
      }
      if (pendingConnectionSourceId === node.id) {
        pendingConnectionSourceId = null;
      }
      renderMapWorkspace();
      renderSubjectNotes();
      saveState();
    });

    element.querySelector(".map-focus-note").addEventListener("click", () => {
      activeMapNodeId = node.id;
      const linkedNote = linkedNotes[0];
      if (linkedNote) {
        loadNoteIntoEditor(linkedNote);
      } else {
        ui.noteTitle.value = node.title || "";
        ui.noteTitle.focus();
        highlightActiveMapNode();
      }
    });

    element.querySelector(".map-connect-node").addEventListener("click", () => {
      if (pendingConnectionSourceId === node.id) {
        pendingConnectionSourceId = null;
        renderMapWorkspace();
        return;
      }

      if (!pendingConnectionSourceId) {
        pendingConnectionSourceId = node.id;
        activeMapNodeId = node.id;
        renderMapWorkspace();
        return;
      }

      if (pendingConnectionSourceId !== node.id) {
        toggleConnection(pendingConnectionSourceId, node.id);
      }
      pendingConnectionSourceId = null;
      renderMapWorkspace();
      saveState();
    });

    element.querySelector(".map-edit-node").addEventListener("click", () => {
      const nextTitle = window.prompt("Titulo da caixa:", node.title || "");
      if (nextTitle === null) {
        return;
      }
      const nextColor = window.prompt("Cor da caixa (hex, ex.: #fff7ed):", node.color || "#fff7ed");
      if (nextColor === null) {
        return;
      }
      const nextImage = window.prompt("Imagem da caixa (URL ou caminho):", node.image || "");
      if (nextImage === null) {
        return;
      }
      const nextText = window.prompt("Texto da caixa:", node.content || "");
      if (nextText === null) {
        return;
      }
      node.title = nextTitle.trim() || node.title;
      node.color = nextColor.trim() || "#fff7ed";
      node.image = nextImage.trim();
      node.content = nextText.trim();
      renderMapWorkspace();
      renderSubjectNotes();
      saveState();
    });

    element.querySelector(".map-node-resize").addEventListener("pointerdown", (event) => {
      event.stopPropagation();
      resizingMapNode = {
        id: node.id,
        startX: event.clientX,
        startY: event.clientY,
        startWidth: node.width,
        startHeight: node.height,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    });

    element.querySelector(".map-node-resize").addEventListener("pointermove", (event) => {
      if (!resizingMapNode || resizingMapNode.id !== node.id) {
        return;
      }
      node.width = Math.max(
        180,
        resizingMapNode.startWidth + (event.clientX - resizingMapNode.startX) / zoom
      );
      node.height = Math.max(
        120,
        resizingMapNode.startHeight + (event.clientY - resizingMapNode.startY) / zoom
      );
      element.style.width = `${node.width}px`;
      element.style.height = `${node.height}px`;
      renderMapConnections();
      maybeGrowMapToFit(node);
    });

    element.querySelector(".map-node-resize").addEventListener("pointerup", (event) => {
      if (resizingMapNode?.id === node.id) {
        resizingMapNode = null;
        saveState();
      }
      const handle = event.currentTarget;
      if (handle.hasPointerCapture(event.pointerId)) {
        handle.releasePointerCapture(event.pointerId);
      }
    });

    ui.mapPlane.appendChild(element);
  });

  renderMapConnections();
  highlightActiveMapNode();
  resizeMapSketchCanvas();
  loadMapSketch();
}

function renderSubjectNotes() {
  if (!ui.subjectNotesList) {
    return;
  }
  const topicState = getActiveTopicState();
  ui.subjectNotesList.innerHTML = "";

  if (!topicState.notes.length) {
    ui.subjectNotesList.innerHTML =
      '<div class="empty-state">Suas anotacoes desta materia vao aparecer aqui.</div>';
    return;
  }

  topicState.notes
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .forEach((note) => {
      const item = document.createElement("article");
      item.className = "subject-note-item";
      item.innerHTML = `
        <p class="subject-note-link">${escapeHtml(note.title)}</p>
        <p class="subject-note-preview">${escapeHtml(stripHtml(note.html).slice(0, 140) || "Sem texto")}</p>
        <p class="subject-note-meta">${escapeHtml(note.fontFamily)} • ${escapeHtml(`${note.fontSize}px`)}</p>
        <div class="card-actions">
          <button class="ghost-button note-edit" type="button">Editar</button>
          <button class="inline-remove note-remove" type="button">Remover</button>
        </div>
      `;

      item.querySelector(".subject-note-link").addEventListener("click", () => {
        const matchedNode = findNodeByTitle(note.title);
        if (matchedNode) {
          focusMapNode(matchedNode.id);
        }
      });

      item.querySelector(".note-edit").addEventListener("click", () => {
        loadNoteIntoEditor(note);
      });

      item.querySelector(".note-remove").addEventListener("click", () => {
        topicState.notes = topicState.notes.filter((entry) => entry.id !== note.id);
        renderSubjectNotes();
        saveState();
      });

      ui.subjectNotesList.appendChild(item);
    });
}

function saveSubjectNote() {
  if (!ui.noteTitle || !ui.noteEditor) {
    return;
  }
  const title = ui.noteTitle.value.trim();
  const html = ui.noteEditor.innerHTML.trim();
  if (!title || !html) {
    return;
  }

  const topicState = getActiveTopicState();
  const note = {
    id: editingSubjectNoteId || crypto.randomUUID(),
    title,
    html,
    fontFamily: ui.noteFontFamily.value,
    fontSize: Number(ui.noteFontSize.value),
    updatedAt: new Date().toISOString(),
  };

  if (editingSubjectNoteId) {
    topicState.notes = topicState.notes.map((entry) =>
      entry.id === editingSubjectNoteId ? note : entry
    );
  } else {
    topicState.notes.unshift(note);
  }

  const matchedNode = findNodeByTitle(note.title);
  if (matchedNode) {
    matchedNode.content = stripHtml(html).slice(0, 220);
    activeMapNodeId = matchedNode.id;
  }

  renderMapWorkspace();
  renderSubjectNotes();
  renderNoteMatchStatus();
  resetNoteEditor();
  saveState();
}

function loadNoteIntoEditor(note) {
  if (!ui.noteEditor) {
    return;
  }
  editingSubjectNoteId = note.id;
  ui.noteTitle.value = note.title;
  ui.noteFontFamily.value = note.fontFamily;
  ui.noteFontSize.value = note.fontSize;
  ui.noteEditor.style.fontFamily = note.fontFamily;
  ui.noteEditor.style.fontSize = `${note.fontSize}px`;
  ui.noteEditor.innerHTML = note.html;
  activeMapNodeId = findNodeByTitle(note.title)?.id || null;
  renderMapWorkspace();
  renderNoteMatchStatus();
  ui.noteEditor.focus();
}

function resetNoteEditor() {
  if (!ui.noteEditor || !ui.noteTitle || !ui.noteFontFamily || !ui.noteFontSize) {
    return;
  }
  editingSubjectNoteId = null;
  ui.noteTitle.value = "";
  ui.noteFontFamily.value = "Cambria Math";
  ui.noteFontSize.value = 18;
  ui.noteEditor.style.fontFamily = ui.noteFontFamily.value;
  ui.noteEditor.style.fontSize = `${ui.noteFontSize.value}px`;
  ui.noteEditor.innerHTML = "";
  renderNoteMatchStatus();
}

function focusMapNode(nodeId) {
  if (!ui.mapStage) {
    return;
  }
  const topicState = getActiveTopicState();
  const node = topicState.nodes.find((entry) => entry.id === nodeId);
  if (!node) {
    return;
  }
  activeMapNodeId = nodeId;
  const zoom = topicState.mapZoom;
  ui.mapStage.scrollTo({
    left: Math.max(0, node.x * zoom - 180),
    top: Math.max(0, node.y * zoom - 120),
    behavior: "smooth",
  });
  highlightActiveMapNode();
}

function highlightActiveMapNode() {
  if (!ui.mapPlane) {
    return;
  }
  ui.mapPlane.querySelectorAll(".map-node").forEach((node) => {
    node.classList.toggle("active", node.dataset.nodeId === activeMapNodeId);
  });
}

function findNodeByTitle(title) {
  const normalizedTitle = normalizeMatchKey(title);
  if (!normalizedTitle) {
    return null;
  }
  return (
    getActiveTopicState().nodes.find((node) => normalizeMatchKey(node.title) === normalizedTitle) || null
  );
}

function getNotesLinkedToNode(node) {
  const normalizedTitle = normalizeMatchKey(node.title);
  if (!normalizedTitle) {
    return [];
  }
  return getActiveTopicState().notes.filter(
    (note) => normalizeMatchKey(note.title) === normalizedTitle
  );
}

function renderNoteMatchStatus() {
  if (!ui.noteMatchStatus || !ui.noteTitle) {
    return;
  }
  const title = ui.noteTitle.value.trim();
  const matchedNode = findNodeByTitle(title);
  ui.noteMatchStatus.textContent =
    title && matchedNode
      ? `Ligacao automatica ativa: a anotacao "${title}" corresponde a uma caixa do mapa com o mesmo nome.`
      : "A ligacao entre anotacao e caixa acontece automaticamente quando os nomes forem iguais.";
}

function normalizeMatchKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function renderMapConnections() {
  if (!ui.mapConnections) {
    return;
  }
  const topicState = getActiveTopicState();
  ui.mapConnections.setAttribute(
    "viewBox",
    `0 0 ${topicState.mapSize.width} ${topicState.mapSize.height}`
  );
  ui.mapConnections.innerHTML = "";

  topicState.connections.forEach((connection, index) => {
    const from = topicState.nodes.find((node) => node.id === connection.from);
    const to = topicState.nodes.find((node) => node.id === connection.to);
    if (!from || !to) {
      return;
    }

    const startX = from.x + from.width / 2;
    const startY = from.y + from.height / 2;
    const endX = to.x + to.width / 2;
    const endY = to.y + to.height / 2;
    const curve = Math.max(70, Math.abs(endX - startX) * 0.35);

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute(
      "d",
      `M ${startX} ${startY} C ${startX + curve} ${startY}, ${endX - curve} ${endY}, ${endX} ${endY}`
    );
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "rgba(107, 76, 35, 0.55)");
    path.setAttribute("stroke-width", "4");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-dasharray", "10 10");
    path.classList.add("map-connection-path");
    path.dataset.connectionIndex = String(index);
    path.addEventListener("click", () => {
      topicState.connections.splice(index, 1);
      renderMapConnections();
      saveState();
    });
    ui.mapConnections.appendChild(path);
  });
}

function resizeMapSketchCanvas() {
  if (!mapSketchCanvas || !mapSketchCtx) {
    return;
  }
  const topicState = getActiveTopicState();
  const ratio = window.devicePixelRatio || 1;
  mapSketchCanvas.width = topicState.mapSize.width * ratio;
  mapSketchCanvas.height = topicState.mapSize.height * ratio;
  mapSketchCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function onMapSketchPointerDown(event) {
  if (!mapSketchCanvas || !mapSketchCtx) {
    return;
  }
  mapSketchDrawing = true;
  mapSketchCanvas.setPointerCapture(event.pointerId);
  const point = getMapSketchPoint(event);
  mapSketchCtx.beginPath();
  mapSketchCtx.moveTo(point.x, point.y);
}

function onMapSketchPointerMove(event) {
  if (!mapSketchCtx) {
    return;
  }
  if (!mapSketchDrawing) {
    return;
  }
  const point = getMapSketchPoint(event);
  mapSketchCtx.lineCap = "round";
  mapSketchCtx.lineJoin = "round";
  mapSketchCtx.lineWidth = Number(ui.noteSketchSize.value);

  if (ui.noteSketchMode.value === "eraser") {
    mapSketchCtx.globalCompositeOperation = "destination-out";
  } else {
    mapSketchCtx.globalCompositeOperation = "source-over";
    mapSketchCtx.strokeStyle = ui.noteSketchColor.value;
  }

  mapSketchCtx.lineTo(point.x, point.y);
  mapSketchCtx.stroke();
  mapSketchCtx.beginPath();
  mapSketchCtx.moveTo(point.x, point.y);
}

function onMapSketchPointerUp(event) {
  if (!mapSketchCanvas || !mapSketchCtx) {
    return;
  }
  if (!mapSketchDrawing) {
    return;
  }
  mapSketchDrawing = false;
  mapSketchCtx.beginPath();
  mapSketchCtx.globalCompositeOperation = "source-over";
  if (mapSketchCanvas.hasPointerCapture(event.pointerId)) {
    mapSketchCanvas.releasePointerCapture(event.pointerId);
  }
  saveMapSketch();
}

function getMapSketchPoint(event) {
  if (!mapSketchCanvas) {
    return { x: 0, y: 0 };
  }
  const rect = mapSketchCanvas.getBoundingClientRect();
  const topicState = getActiveTopicState();
  return {
    x: ((event.clientX - rect.left) / rect.width) * topicState.mapSize.width,
    y: ((event.clientY - rect.top) / rect.height) * topicState.mapSize.height,
  };
}

function saveMapSketch() {
  if (!mapSketchCanvas) {
    return;
  }
  const topicState = getActiveTopicState();
  topicState.sketch = mapSketchCanvas.toDataURL("image/png");
  saveState();
}

function clearMapSketch() {
  if (!mapSketchCtx || !mapSketchCanvas) {
    return;
  }
  mapSketchCtx.clearRect(0, 0, mapSketchCanvas.width, mapSketchCanvas.height);
  getActiveTopicState().sketch = "";
  saveState();
}

function loadMapSketch() {
  if (!mapSketchCtx || !mapSketchCanvas) {
    return;
  }
  mapSketchCtx.clearRect(0, 0, mapSketchCanvas.width, mapSketchCanvas.height);
  const sketch = getActiveTopicState().sketch;
  if (!sketch) {
    return;
  }
  const image = new Image();
  image.onload = () => {
    mapSketchCtx.clearRect(0, 0, mapSketchCanvas.width, mapSketchCanvas.height);
    const { width, height } = getActiveTopicState().mapSize;
    mapSketchCtx.drawImage(image, 0, 0, width, height);
  };
  image.src = sketch;
}

function updateSummary() {
  if (ui.metricTasks) {
    ui.metricTasks.textContent = String(
      state.tasks.filter((task) => task.column !== "done").length
    );
  }
  if (ui.metricEntries) {
    ui.metricEntries.textContent = String(state.journalEntries.length);
  }
  if (ui.metricVideos) {
    ui.metricVideos.textContent = String(state.videos.length);
  }
}

function updateTodayFocus() {
  if (!ui.todayFocus) {
    return;
  }
  const firstFocus = state.tasks.find((task) => task.column === "focus");
  ui.todayFocus.textContent = firstFocus
    ? `Prioridade atual: ${firstFocus.title} (${firstFocus.time}).`
    : "Sem prioridade definida. Escolha um bloco e puxe para Foco.";
}

function labelForColumn(column) {
  return boardColumns.find((item) => item.key === column)?.title ?? column;
}

function formatDateInput(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDateLong(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function sanitizeText(value) {
  return value || "Sem registro";
}

function readStoredState() {
  try {
    const localValue = localStorage.getItem(STORAGE_KEY);
    if (localValue) {
      return localValue;
    }
  } catch (error) {
    console.warn("Nao foi possivel ler localStorage.", error);
  }

  return readWindowNameState();
}

function writeStoredState(value) {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch (error) {
    console.warn("Nao foi possivel gravar no localStorage.", error);
  }

  writeWindowNameState(value);
}

function readWindowNameState() {
  try {
    if (!window.name) {
      return "";
    }
    const parsed = JSON.parse(window.name);
    return parsed?.[STORAGE_KEY] || "";
  } catch (error) {
    return "";
  }
}

function writeWindowNameState(value) {
  try {
    const parsed = window.name ? JSON.parse(window.name) : {};
    parsed[STORAGE_KEY] = value;
    window.name = JSON.stringify(parsed);
  } catch (error) {
    window.name = JSON.stringify({ [STORAGE_KEY]: value });
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function stripHtml(value) {
  const temp = document.createElement("div");
  temp.innerHTML = value;
  return temp.textContent || temp.innerText || "";
}

function normalizeNoteLibrary(noteLibrary) {
  const next = {
    customOtherSubjects: noteLibrary?.customOtherSubjects || [],
    activeSubjectKey:
      noteLibrary?.activeSubjectKey ||
      getSubjectKey(defaultNoteSubject.category, defaultNoteSubject.subject),
    subjects: {},
  };

  const categories = ["humanas", "exatas", "outras"];
  categories.forEach((category) => {
    getSubjectsForCategory(category, next.customOtherSubjects).forEach((subject) => {
      const key = getSubjectKey(category, subject);
      next.subjects[key] = normalizeSubjectState(noteLibrary?.subjects?.[key], category, subject);
    });
  });

  if (!next.subjects[next.activeSubjectKey]) {
    next.activeSubjectKey = getSubjectKey(defaultNoteSubject.category, defaultNoteSubject.subject);
  }

  return next;
}

function normalizeSubjectState(subjectState, category, subject) {
  const legacyTopic = {
    id: DEFAULT_TOPIC_ID,
    name: "Geral",
    mapZoom: Math.min(2.5, Math.max(0.5, subjectState?.mapZoom || 1)),
    mapSize: {
      width: Math.max(DEFAULT_MAP_WIDTH, subjectState?.mapSize?.width || DEFAULT_MAP_WIDTH),
      height: Math.max(DEFAULT_MAP_HEIGHT, subjectState?.mapSize?.height || DEFAULT_MAP_HEIGHT),
    },
    nodes: Array.isArray(subjectState?.nodes)
      ? subjectState.nodes.map((node, index) => ({
          id: node.id || crypto.randomUUID(),
          title: node.title || `Caixa ${index + 1}`,
          color: node.color || "#fff7ed",
          image: node.image || "",
          content: node.content || "",
          x: Number.isFinite(node.x) ? node.x : 120 + index * 30,
          y: Number.isFinite(node.y) ? node.y : 120 + index * 30,
          width: Math.max(180, node.width || 220),
          height: Math.max(120, node.height || 150),
        }))
      : [],
    notes: Array.isArray(subjectState?.notes)
      ? subjectState.notes.map((note) => ({
          id: note.id || crypto.randomUUID(),
          title: note.title || "Anotacao sem titulo",
          html: note.html || "",
          fontFamily: note.fontFamily || "Cambria Math",
          fontSize: note.fontSize || 18,
          updatedAt: note.updatedAt || new Date().toISOString(),
        }))
      : [],
    connections: Array.isArray(subjectState?.connections)
      ? subjectState.connections
          .filter((connection) => connection?.from && connection?.to)
          .map((connection) => ({
            from: connection.from,
            to: connection.to,
          }))
      : [],
    sketch: subjectState?.sketch || "",
  };

  const topics = Array.isArray(subjectState?.topics) && subjectState.topics.length
    ? subjectState.topics.map((topic, topicIndex) => ({
        id: topic.id || `topic-${topicIndex + 1}`,
        name: topic.name || `Assunto ${topicIndex + 1}`,
        mapZoom: Math.min(2.5, Math.max(0.5, topic.mapZoom || 1)),
        mapSize: {
          width: Math.max(DEFAULT_MAP_WIDTH, topic?.mapSize?.width || DEFAULT_MAP_WIDTH),
          height: Math.max(DEFAULT_MAP_HEIGHT, topic?.mapSize?.height || DEFAULT_MAP_HEIGHT),
        },
        nodes: Array.isArray(topic?.nodes) ? topic.nodes : [],
        notes: Array.isArray(topic?.notes) ? topic.notes : [],
        connections: Array.isArray(topic?.connections) ? topic.connections : [],
        sketch: topic?.sketch || "",
      })).map((topic) => normalizeTopicState(topic))
    : [normalizeTopicState(legacyTopic)];

  return {
    category,
    subject,
    activeTopicId:
      topics.find((topic) => topic.id === subjectState?.activeTopicId)?.id || topics[0].id,
    topics,
  };
}

function normalizeTopicState(topic) {
  return {
    id: topic.id || DEFAULT_TOPIC_ID,
    name: topic.name || "Geral",
    mapZoom: Math.min(2.5, Math.max(0.5, topic?.mapZoom || 1)),
    mapSize: {
      width: Math.max(DEFAULT_MAP_WIDTH, topic?.mapSize?.width || DEFAULT_MAP_WIDTH),
      height: Math.max(DEFAULT_MAP_HEIGHT, topic?.mapSize?.height || DEFAULT_MAP_HEIGHT),
    },
    nodes: Array.isArray(topic?.nodes)
      ? topic.nodes.map((node, index) => ({
          id: node.id || crypto.randomUUID(),
          title: node.title || `Caixa ${index + 1}`,
          color: node.color || "#fff7ed",
          image: node.image || "",
          content: node.content || "",
          x: Number.isFinite(node.x) ? node.x : 120 + index * 30,
          y: Number.isFinite(node.y) ? node.y : 120 + index * 30,
          width: Math.max(180, node.width || 220),
          height: Math.max(120, node.height || 150),
        }))
      : [],
    notes: Array.isArray(topic?.notes)
      ? topic.notes.map((note) => ({
          id: note.id || crypto.randomUUID(),
          title: note.title || "Anotacao sem titulo",
          html: note.html || "",
          fontFamily: note.fontFamily || "Cambria Math",
          fontSize: note.fontSize || 18,
          updatedAt: note.updatedAt || new Date().toISOString(),
        }))
      : [],
    connections: Array.isArray(topic?.connections)
      ? topic.connections
          .filter((connection) => connection?.from && connection?.to)
          .map((connection) => ({
            from: connection.from,
            to: connection.to,
          }))
      : [],
    sketch: topic?.sketch || "",
  };
}

function getSubjectsForCategory(category, otherSubjects = state.noteLibrary.customOtherSubjects) {
  if (category === "outras") {
    return otherSubjects;
  }
  return noteCatalog[category];
}

function getSubjectKey(category, subject) {
  return `${category}::${subject}`;
}

function getActiveSubject() {
  const [category, subject] = state.noteLibrary.activeSubjectKey.split("::");
  return {
    category,
    subject,
  };
}

function ensureSubjectState(key, category, subject) {
  if (!state.noteLibrary.subjects[key]) {
    state.noteLibrary.subjects[key] = normalizeSubjectState({}, category, subject);
  }
  return state.noteLibrary.subjects[key];
}

function getActiveSubjectState() {
  const subject = getActiveSubject();
  return ensureSubjectState(
    state.noteLibrary.activeSubjectKey,
    subject.category,
    subject.subject
  );
}

function getActiveTopicState() {
  const subjectState = getActiveSubjectState();
  return (
    subjectState.topics.find((topic) => topic.id === subjectState.activeTopicId) ||
    subjectState.topics[0]
  );
}

function createConnection(fromId, toId) {
  const topicState = getActiveTopicState();
  const exists = areNodesConnected(fromId, toId);
  if (exists) {
    return;
  }
  topicState.connections.push({ from: fromId, to: toId });
}

function toggleConnection(fromId, toId) {
  const topicState = getActiveTopicState();
  const index = topicState.connections.findIndex(
    (connection) =>
      (connection.from === fromId && connection.to === toId) ||
      (connection.from === toId && connection.to === fromId)
  );

  if (index >= 0) {
    topicState.connections.splice(index, 1);
    return;
  }

  topicState.connections.push({ from: fromId, to: toId });
}

function areNodesConnected(fromId, toId) {
  return getActiveTopicState().connections.some(
    (connection) =>
      (connection.from === fromId && connection.to === toId) ||
      (connection.from === toId && connection.to === fromId)
  );
}

function adjustMapZoom(delta) {
  const topicState = getActiveTopicState();
  topicState.mapZoom = Math.min(2.5, Math.max(0.5, topicState.mapZoom + delta));
  renderMapWorkspace();
  saveState();
}

function resetMapZoom() {
  const topicState = getActiveTopicState();
  topicState.mapZoom = 1;
  renderMapWorkspace();
  saveState();
}

function maybeGrowMapToFit(node) {
  const topicState = getActiveTopicState();
  const rightEdge = node.x + node.width + 140;
  const bottomEdge = node.y + node.height + 140;
  let changed = false;

  if (rightEdge > topicState.mapSize.width) {
    topicState.mapSize.width = Math.max(topicState.mapSize.width + 400, rightEdge);
    changed = true;
  }

  if (bottomEdge > topicState.mapSize.height) {
    topicState.mapSize.height = Math.max(topicState.mapSize.height + 300, bottomEdge);
    changed = true;
  }

  if (changed) {
    ui.mapViewport.style.width = `${topicState.mapSize.width * topicState.mapZoom}px`;
    ui.mapViewport.style.height = `${topicState.mapSize.height * topicState.mapZoom}px`;
    ui.mapPlane.style.width = `${topicState.mapSize.width}px`;
    ui.mapPlane.style.height = `${topicState.mapSize.height}px`;
    renderMapConnections();
    resizeMapSketchCanvas();
    loadMapSketch();
  }
}

async function toggleMapFullscreen() {
  if (!ui.mapStage || !ui.toggleMapFullscreen) {
    return;
  }

  if (document.fullscreenElement === ui.mapStage) {
    await document.exitFullscreen();
    return;
  }

  await ui.mapStage.requestFullscreen();
}

function updateFullscreenButtonLabel() {
  if (!ui.toggleMapFullscreen || !ui.mapStage) {
    return;
  }

  ui.toggleMapFullscreen.textContent =
    document.fullscreenElement === ui.mapStage ? "Sair da tela cheia" : "Tela cheia";
}

function createTopicId(subjectState, name) {
  const base =
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "assunto";
  let candidate = base;
  let suffix = 2;
  while (subjectState.topics.some((topic) => topic.id === candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

function normalizeJournalFields(fields) {
  if (!Array.isArray(fields) || !fields.length) {
    return structuredClone(defaultJournalFields);
  }

  return fields.map((field, index) => ({
    id: field.id || `field-${index + 1}`,
    label: field.label || `Topico ${index + 1}`,
    placeholder: field.placeholder || `Escreva sobre ${field.label || `topico ${index + 1}`}`,
    rows: field.rows || 2,
  }));
}

function normalizeJournalEntries(entries, fields) {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries.map((entry) => {
    if (entry.values && typeof entry.values === "object") {
      return {
        ...entry,
        values: ensureEntryValues(entry.values, fields),
      };
    }

    return {
      id: entry.id || crypto.randomUUID(),
      date: entry.date || formatDateInput(new Date()),
      values: ensureEntryValues(
        {
          food: entry.food,
          sleep: entry.sleep,
          love: entry.love,
          progress: entry.progress,
        },
        fields
      ),
    };
  });
}

function ensureEntryValues(values, fields) {
  const nextValues = {};
  fields.forEach((field) => {
    nextValues[field.id] = values?.[field.id] ?? "";
  });
  return nextValues;
}

function createFieldId(label) {
  const base = label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "topico";
  let candidate = base;
  let suffix = 2;

  while (state.journalFields.some((field) => field.id === candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function removeJournalField(index) {
  const [removed] = state.journalFields.splice(index, 1);
  if (!removed) {
    return;
  }

  state.journalEntries = state.journalEntries.map((entry) => {
    const nextValues = { ...(entry.values || {}) };
    delete nextValues[removed.id];
    return { ...entry, values: nextValues };
  });

  renderJournalFields();
  renderJournal();
  saveState();
}
