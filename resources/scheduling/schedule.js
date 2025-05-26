let processes = [];
let currentTime = 0;
let ganttChart = [];
let timer = null;
let isPaused = true;
let processHistory = [];
let rrQueue = [];
let quantum = 2;

function generateRandomProcess(id) {
  return {
    id: "P" + id,
    arrival: Math.floor(Math.random() * 10),
    burst: Math.floor(Math.random() * 10) + 1,
    priority: Math.floor(Math.random() * 5) + 1,
    remaining: null,
    finished: false
  };
}

function renderTable() {
  const container = document.getElementById("process-table");
  if (processes.length === 0) {
    container.innerHTML = "<p>No processes added yet.</p>";
    return;
  }

  const table = `
    <table>
      <thead>
        <tr>
          <th>Process</th>
          <th>Arrival</th>
          <th>Burst</th>
          <th>Priority</th>
          <th>Remaining</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${processes.map((p, index) => `
          <tr>
            <td>${p.id}</td>
            <td>${p.arrival}</td>
            <td>${p.burst}</td>
            <td>${p.priority}</td>
            <td>${p.remaining ?? p.burst}</td>
            <td class="process-actions">
              <button class="delete-btn" onclick="deleteProcess(${index})">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  container.innerHTML = table;
}

function log(message) {
  const el = document.getElementById("execution-log");
  el.innerHTML += `<p>${message}</p>`;
  el.scrollTop = el.scrollHeight;
}

function resetLog() {
  document.getElementById("execution-log").innerHTML = "";
}

function renderGantt() {
  const container = document.getElementById("gantt-chart");
  container.innerHTML = ganttChart.map(p => `<div class="gantt-block">${p}</div>`).join('');
}

function resetSimulation() {
  currentTime = 0;
  ganttChart = [];
  isPaused = true;
  rrQueue = [];
  clearInterval(timer);
  processHistory = [];
  processes.forEach(p => {
    p.remaining = p.burst;
    p.finished = false;
  });
  renderTable();
  renderGantt();
  resetLog();
}

function selectNextProcess(policy) {
  const ready = processes.filter(p => p.arrival <= currentTime && !p.finished && p.remaining > 0);

  if (policy === "fcfs") {
    return ready.sort((a, b) => a.arrival - b.arrival)[0];
  }
  if (policy === "sjf") {
    return ready.sort((a, b) => a.remaining - b.remaining)[0];
  }
  if (policy === "priority") {
    return ready.sort((a, b) => a.priority - b.priority)[0];
  }
  return null;
}

function step(policy) {
  let currentProcess = null;

  if (policy === "rr") {
    if (rrQueue.length === 0) {
      rrQueue = processes
        .filter(p => p.arrival <= currentTime && !p.finished && p.remaining > 0)
        .sort((a, b) => a.arrival - b.arrival);
    }

    if (rrQueue.length === 0) {
      ganttChart.push("Idle");
      currentTime++;
      renderGantt();
      return;
    }

    currentProcess = rrQueue.shift();
    const slice = Math.min(currentProcess.remaining, quantum);
    for (let i = 0; i < slice; i++) {
      currentProcess.remaining--;
      ganttChart.push(currentProcess.id);
      log(`🔄 Time ${currentTime + i}: ${currentProcess.id} running`);
    }
    currentTime += slice;

    if (currentProcess.remaining > 0) {
      const newArrivals = processes.filter(p => p.arrival <= currentTime && !p.finished && p.remaining > 0 && p !== currentProcess);
      rrQueue.push(...newArrivals.filter(p => !rrQueue.includes(p)));
      rrQueue.push(currentProcess);
    } else {
      currentProcess.finished = true;
      log(`✅ ${currentProcess.id} completed`);
    }

  } else {
    currentProcess = selectNextProcess(policy);
    if (!currentProcess) {
      ganttChart.push("Idle");
      currentTime++;
      renderGantt();
      return;
    }

    currentProcess.remaining--;
    ganttChart.push(currentProcess.id);
    log(`🔄 Time ${currentTime}: ${currentProcess.id} running`);
    if (currentProcess.remaining === 0) {
      currentProcess.finished = true;
      log(`✅ ${currentProcess.id} completed`);
    }

    currentTime++;
  }

  processHistory.push(JSON.parse(JSON.stringify(processes)));
  renderGantt();
  renderTable();
}

function play(policy) {
  isPaused = false;
  timer = setInterval(() => {
    const stillRunning = processes.some(p => p.remaining > 0);
    if (stillRunning) {
      step(policy);
    } else {
      clearInterval(timer);
      log("🎉 All processes completed.");
    }
  }, 1000);
}

function pause() {
  clearInterval(timer);
  isPaused = true;
}

function back() {
  if (processHistory.length === 0) return;
  processes = JSON.parse(JSON.stringify(processHistory.pop()));
  currentTime--;
  ganttChart.pop();
  renderTable();
  renderGantt();
}

function showConfirmation(message) {
  return new Promise((resolve) => {
    const dialog = document.getElementById('confirmation-dialog');
    const messageEl = document.getElementById('confirmation-message');
    const yesBtn = document.getElementById('confirm-yes');
    const noBtn = document.getElementById('confirm-no');

    messageEl.textContent = message;
    dialog.classList.remove('hidden');

    const handleYes = () => {
      dialog.classList.add('hidden');
      resolve(true);
      cleanup();
    };

    const handleNo = () => {
      dialog.classList.add('hidden');
      resolve(false);
      cleanup();
    };

    const cleanup = () => {
      yesBtn.removeEventListener('click', handleYes);
      noBtn.removeEventListener('click', handleNo);
    };

    yesBtn.addEventListener('click', handleYes);
    noBtn.addEventListener('click', handleNo);
  });
}

function deleteProcess(index) {
  showConfirmation("Are you sure you want to delete this process?").then((confirmed) => {
    if (confirmed) {
      processes.splice(index, 1);
      // Update process IDs
      processes.forEach((p, i) => {
        p.id = "P" + (i + 1);
      });
      renderTable();
    }
  });
}

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("add-process").addEventListener("click", () => {
    const proc = generateRandomProcess(processes.length + 1);
    proc.remaining = proc.burst;
    processes.push(proc);
    renderTable();
  });

  document.getElementById("policy-select").addEventListener("change", () => {
    const policy = document.getElementById("policy-select").value;
    const quantumInput = document.getElementById("time-quantum");
    const label = document.getElementById("quantum-label");
    if (policy === "rr") {
      quantumInput.style.display = "inline";
      label.style.display = "inline";
    } else {
      quantumInput.style.display = "none";
      label.style.display = "none";
    }
  });

  document.getElementById("play").addEventListener("click", () => {
    const policy = document.getElementById("policy-select").value;
    if (!policy) return alert("Select a policy first.");
    quantum = parseInt(document.getElementById("time-quantum").value) || 2;
    play(policy);
  });

  document.getElementById("pause").addEventListener("click", pause);

  document.getElementById("next").addEventListener("click", () => {
    const policy = document.getElementById("policy-select").value;
    if (!policy) return alert("Select a policy first.");
    quantum = parseInt(document.getElementById("time-quantum").value) || 2;
    step(policy);
  });

  document.getElementById("back").addEventListener("click", back);

  document.getElementById("reset").addEventListener("click", resetSimulation);

  document.getElementById("show-custom-form").addEventListener("click", () => {
    document.getElementById("process-input").classList.remove("hidden");
  });

  document.getElementById("add-custom-process").addEventListener("click", () => {
    const arrivalTime = parseInt(document.getElementById("arrival-time").value) || 0;
    const burstTime = parseInt(document.getElementById("burst-time").value) || 1;
    const priority = parseInt(document.getElementById("priority").value) || 1;

    if (burstTime < 1) {
      alert("Burst time must be at least 1");
      return;
    }

    if (priority < 1 || priority > 5) {
      alert("Priority must be between 1 and 5");
      return;
    }

    const proc = {
      id: "P" + (processes.length + 1),
      arrival: arrivalTime,
      burst: burstTime,
      priority: priority,
      remaining: burstTime,
      finished: false
    };

    processes.push(proc);
    renderTable();
    
    // Clear form and hide it
    document.getElementById("arrival-time").value = "0";
    document.getElementById("burst-time").value = "1";
    document.getElementById("priority").value = "1";
    document.getElementById("process-input").classList.add("hidden");
  });

  document.getElementById("clear-all").addEventListener("click", () => {
    showConfirmation("Are you sure you want to delete all processes?").then((confirmed) => {
      if (confirmed) {
        processes = [];
        renderTable();
        resetSimulation();
      }
    });
  });
});