import React, { useEffect, useMemo, useState } from "react";
import { Plus, ArrowLeft, Mic, FileText, IndianRupee, FolderPlus, Save } from "lucide-react";

const STORAGE_KEY = "construction-expense-hindi-app-v1";

const ui = {
  appTitle: "खर्चा हिसाब",
  addProject: "नया प्रोजेक्ट",
  projectName: "प्रोजेक्ट का नाम",
  save: "सेव करें",
  viewSummary: "सारांश देखें",
  addItem: "नया खर्च जोड़ें",
  dictate: "बोलकर लिखें",
  itemPlaceholder: "खर्च का नाम",
  amountPlaceholder: "राशि दर्ज करें",
  total: "कुल योग",
  noProjects: "अभी कोई प्रोजेक्ट नहीं है",
  noItems: "अभी कोई खर्च नहीं जोड़ा गया",
  summaryTitle: "सारांश",
  addItemTitle: "नया खर्च",
  projectRequired: "कृपया प्रोजेक्ट का नाम लिखें",
  itemRequired: "कृपया खर्च का नाम लिखें",
  amountRequired: "कृपया राशि लिखें",
  speechNotSupported: "इस ब्राउज़र में वॉइस इनपुट उपलब्ध नहीं है",
  listening: "सुन रहा है...",
  tapMic: "माइक दबाकर बोलें",
  saved: "सेव हो गया"
};

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { projects: [] };
    return JSON.parse(raw);
  } catch {
    return { projects: [] };
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function formatCurrency(num) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(Number(num || 0));
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function BigButton({ icon, label, onClick, secondary = false }) {
  return (
    <button
      onClick={onClick}
      className={`big-button ${secondary ? "big-button-secondary" : "big-button-primary"}`}
    >
      <span className={`button-icon-wrap ${secondary ? "button-icon-secondary" : "button-icon-primary"}`}>
        {icon}
      </span>
      <span className="button-label">{label}</span>
    </button>
  );
}

export default function App() {
  const [data, setData] = useState({ projects: [] });
  const [screen, setScreen] = useState("home");
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [newProjectName, setNewProjectName] = useState("");
  const [itemName, setItemName] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    setData(loadData());
  }, []);

  useEffect(() => {
    saveData(data);
  }, [data]);

  const selectedProject = useMemo(
    () => data.projects.find((p) => p.id === selectedProjectId) || null,
    [data.projects, selectedProjectId]
  );

  const total = useMemo(() => {
    if (!selectedProject) return 0;
    return selectedProject.items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [selectedProject]);

  function resetMessage() {
    setMessage("");
  }

  function addProject() {
    resetMessage();
    const name = newProjectName.trim();
    if (!name) {
      setMessage(ui.projectRequired);
      return;
    }

    const project = {
      id: makeId(),
      name,
      createdAt: new Date().toISOString(),
      items: []
    };

    setData((prev) => ({
      ...prev,
      projects: [project, ...prev.projects]
    }));

    setNewProjectName("");
    setScreen("home");
  }

  function openProject(projectId) {
    setSelectedProjectId(projectId);
    setScreen("projectActions");
    resetMessage();
  }

  function addExpenseItem() {
    resetMessage();
    const cleanName = itemName.trim();
    const cleanAmount = amount.toString().trim();

    if (!cleanName) {
      setMessage(ui.itemRequired);
      return;
    }

    if (!cleanAmount) {
      setMessage(ui.amountRequired);
      return;
    }

    setData((prev) => ({
      ...prev,
      projects: prev.projects.map((project) => {
        if (project.id !== selectedProjectId) return project;
        return {
          ...project,
          items: [
            {
              id: makeId(),
              name: cleanName,
              amount: Number(cleanAmount),
              createdAt: new Date().toISOString()
            },
            ...project.items
          ]
        };
      })
    }));

    setItemName("");
    setAmount("");
    setMessage(ui.saved);
  }

  function startSpeech() {
    resetMessage();
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMessage(ui.speechNotSupported);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "hi-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setMessage(ui.listening);
    };

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      setItemName((prev) => (prev ? `${prev} ${transcript}` : transcript));
      setMessage("");
    };

    recognition.onerror = () => {
      setMessage("वॉइस इनपुट में दिक्कत आई");
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }

  function Header({ title, onBack, leftAction }) {
    return (
      <div className="header">
        <div className="header-side">
          {onBack ? (
            <button onClick={onBack} className="icon-button" aria-label="back">
              <ArrowLeft size={28} />
            </button>
          ) : leftAction ? (
            leftAction
          ) : null}
        </div>
        <div className="header-title">{title}</div>
        <div className="header-side" />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="phone-frame">
        {screen === "home" && (
          <div>
            <Header
              title={ui.appTitle}
              leftAction={
                <button
                  onClick={() => {
                    setScreen("addProject");
                    resetMessage();
                  }}
                  className="icon-button"
                  aria-label="add project"
                >
                  <Plus size={28} />
                </button>
              }
            />

            <div className="screen-stack">
              {data.projects.length === 0 ? (
                <div className="empty-card">{ui.noProjects}</div>
              ) : (
                data.projects.map((project) => (
                  <BigButton
                    key={project.id}
                    icon={<FileText size={30} />}
                    label={project.name}
                    onClick={() => openProject(project.id)}
                    secondary
                  />
                ))
              )}
            </div>
          </div>
        )}

        {screen === "addProject" && (
          <div>
            <Header title={ui.addProject} onBack={() => setScreen("home")} />

            <div className="screen-stack">
              <div className="card">
                <label className="field-label">{ui.projectName}</label>
                <input
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="text-input"
                  placeholder={ui.projectName}
                />
              </div>

              <BigButton icon={<FolderPlus size={30} />} label={ui.save} onClick={addProject} />

              {message && <div className="message">{message}</div>}
            </div>
          </div>
        )}

        {screen === "projectActions" && selectedProject && (
          <div>
            <Header title={selectedProject.name} onBack={() => setScreen("home")} />

            <div className="screen-stack">
              <BigButton
                icon={<FileText size={30} />}
                label={ui.viewSummary}
                onClick={() => setScreen("summary")}
                secondary
              />

              <BigButton
                icon={<Plus size={30} />}
                label={ui.addItem}
                onClick={() => {
                  setScreen("addItem");
                  resetMessage();
                }}
              />
            </div>
          </div>
        )}

        {screen === "addItem" && selectedProject && (
          <div>
            <Header title={ui.addItemTitle} onBack={() => setScreen("projectActions")} />

            <div className="screen-stack">
              <button onClick={startSpeech} className="mic-button">
                <Mic size={30} />
                <span>{isListening ? ui.listening : ui.dictate}</span>
              </button>

              <div className="card">
                <label className="field-label">{ui.itemPlaceholder}</label>
                <textarea
                  rows={3}
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="text-area"
                  placeholder={ui.tapMic}
                />
              </div>

              <div className="card">
                <label className="field-label">{ui.amountPlaceholder}</label>
                <div className="amount-wrap">
                  <IndianRupee size={26} className="amount-icon" />
                  <input
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                    className="amount-input"
                    placeholder="0"
                  />
                </div>
              </div>

              <BigButton icon={<Save size={30} />} label={ui.save} onClick={addExpenseItem} />

              {message && <div className="message">{message}</div>}
            </div>
          </div>
        )}

        {screen === "summary" && selectedProject && (
          <div>
            <Header title={ui.summaryTitle} onBack={() => setScreen("projectActions")} />

            <div className="screen-stack">
              {selectedProject.items.length === 0 ? (
                <div className="empty-card">{ui.noItems}</div>
              ) : (
                selectedProject.items.map((item) => (
                  <div key={item.id} className="item-card">
                    <div className="item-name">{item.name}</div>
                    <div className="item-amount">{formatCurrency(item.amount)}</div>
                  </div>
                ))
              )}

              <div className="total-card">
                <div className="total-label">{ui.total}</div>
                <div className="total-value">{formatCurrency(total)}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}