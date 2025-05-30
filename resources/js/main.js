let codeEditor;
let camera;
let musicPlayer;
let minimized;
let maximized;
let currentFileHandle;
let isFileSaved = true;
let editorHistory = [];
let currentHistoryIndex = -1;
let lastSavedContent = "";
let saveInterval = 2000; // Save every 2 seconds
let fileManager;
let editorState = "normal"; // 'minimized', 'normal', or 'maximized'
let isPlaying = false;
let track_index = 0;
let updateTimer;

let curr_track = document.createElement("audio");

let now_playing;
let track_art;
let track_name;
let track_artist;

let playpause_btn;
let next_btn;
let prev_btn;

let seek_slider;
let volume_slider;
let curr_time;
let total_duration;

let track_list = [
  {
    name: "Houdini (Extended Edit)",
    artist: "Dua Lipa",
    image: "songCov/houdini.png",
    path: "songs/houdini.mp3",
  },
  {
    name: "intro (end of the world)",
    artist: "Ariana Grande",
    image: "songCov/intro.png",
    path: "songs/intro.mp3",
  },
  {
    name: "10 Minutes",
    artist: "Lee Hyori",
    image: "songCov/minute.png",
    path: "songs/minute.mp3",
  },
];

// Improve the scaling function to handle different system scaling settings
// Define scaling function globally so it can be called immediately
function setBodyScale() {
  const targetScale = 1.25; // Fixed scale at 125%
  
  // Get device pixel ratio to account for system scaling
  const devicePixelRatio = window.devicePixelRatio || 1;
  
  // Calculate the scale needed to compensate for system scaling
  const compensatedScale = targetScale / devicePixelRatio;
  
  // Apply scaling to body
  document.body.style.transform = `scale(${compensatedScale})`;
  document.body.style.transformOrigin = 'top left';
  document.body.style.width = `${100 / compensatedScale}%`;
  document.body.style.height = `${100 / compensatedScale}%`;
  
  // Adjust modal scale to counteract body scaling
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => {
    modal.style.transform = `scale(${1 / compensatedScale})`;
    modal.style.transformOrigin = 'top left';
  });
  
  // Set the CSS variable for the current scale
  document.documentElement.style.setProperty('--current-scale', compensatedScale);
  
  console.log(`Device pixel ratio: ${devicePixelRatio}, Applied scale: ${compensatedScale}`);
}

document.addEventListener('DOMContentLoaded', function() {
  // Apply scaling immediately
  setBodyScale();
  
  // Prevent scrolling
  document.body.addEventListener('wheel', function(e) {
    e.preventDefault();
  }, { passive: false });
  
  // Prevent pinch zoom
  document.addEventListener('gesturestart', function(e) {
    e.preventDefault();
  });
  
  document.addEventListener('touchmove', function(e) {
    if (e.touches.length > 1) {
      e.preventDefault();
    }
  }, { passive: false });
  
  // Prevent page scrolling with arrow keys, space, etc.
  window.addEventListener('keydown', function(e) {
    if(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].indexOf(e.code) > -1 && 
       !document.activeElement.matches('input, textarea, [contenteditable]')) {
      e.preventDefault();
    }
  });
  
  // Listen for window resize events to re-apply scaling
  window.addEventListener('resize', setBodyScale);
});

function onWindowClose() {
  Neutralino.app.exit();
}

Neutralino.init();
Neutralino.events.on("windowClose", onWindowClose);

document.addEventListener("DOMContentLoaded", function () {
  // Apply scaling immediately
  setBodyScale();
  
  // Check if we're on the splash screen
  const splashScreen = document.getElementById("splash-screen");
  
  if (splashScreen) {
    // We're on the splash screen (index.html)
    setTimeout(function () {
      // Start the fade out animation
      splashScreen.style.transition = "opacity 1s ease-out";
      splashScreen.style.opacity = 0;
      
      setTimeout(function () {
        // Instead of traditional redirect, use a smoother transition
        // First, fetch index2.html content
        fetch('index2.html')
          .then(response => response.text())
          .then(html => {
            // Create a temporary container to process the HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            
            // Extract the body content from the fetched HTML
            const newBodyContent = tempDiv.querySelector('body').innerHTML;
            
            // Apply a fade-in effect for the new content
            const mainContent = document.createElement('div');
            mainContent.innerHTML = newBodyContent;
            mainContent.style.opacity = 0;
            mainContent.style.transition = 'opacity 0.5s ease-in';
            
            // Clear the current body content but maintain scaling
            document.body.innerHTML = '';
            
            // Append the new content
            document.body.appendChild(mainContent);

            initDrawerFeatures(); // re-run drawer logic after DOM is ready

            // Rebind shutdown button
            const shutdownButton = document.getElementById("shutdown-button");
            if (shutdownButton) {
              shutdownButton.addEventListener("click", shutdown);
            }
            
            // Force a reflow to ensure smooth transition
            void mainContent.offsetWidth;
            
            // Fade in the new content
            mainContent.style.opacity = 1;
            
            // Execute any scripts in the new content
            const scripts = Array.from(tempDiv.querySelectorAll('script'));
            scripts.forEach(script => {
              // Skip scripts that were already loaded in the head
              if (script.src && (script.src.includes('neutralino.js') || script.src.includes('main.js'))) {
                return;
              }
              
              const newScript = document.createElement('script');
              if (script.src) {
                newScript.src = script.src;
              } else {
                newScript.textContent = script.textContent;
              }
              document.body.appendChild(newScript);
            });
            
            // Reapply scaling to ensure it's maintained
            setBodyScale();
          })
          .catch(error => {
            console.error('Error during page transition:', error);
            // Fallback to traditional redirect if fetch fails
            window.location.href = "index2.html";
          });
      }, 1000);
    }, 10000);
  }

  const textEditorHexagon = document.querySelector(
    ".hexagon-wrapper:nth-child(1) .hexagon"
  );
  const fileExplorerHexagon = document.querySelector(
    ".hexagon-wrapper:nth-child(2) .hexagon"
  );
  const cameraHexagon = document.querySelector(
    ".hexagon-wrapper:nth-child(3) .hexagon"
  );
  const musicPlayerHexagon = document.querySelector(
    ".hexagon-wrapper:nth-child(4) .hexagon"
  );

  textEditorHexagon.addEventListener("click", createNewFile);
  fileExplorerHexagon.addEventListener("click", openFile);
  cameraHexagon.addEventListener("click", openCamera);
  musicPlayerHexagon.addEventListener("click", openMusic);

  const editorTask = document.getElementById("editor-task");
  editorTask.addEventListener("click", toggleEditor);

  // --- Add this block to enable resizing ---
  const container = document.getElementById("editor-container");

  let isResizing = false;
  let currentEdge = null;
  let startX, startY;
  let startWidth, startHeight;
  let startLeft, startTop;
  
  const MIN_WIDTH = 300;
  const MIN_HEIGHT = 200;
  const EDGE_THRESHOLD = 10;
  
  // Detect edges for resizing
  container.addEventListener("mousemove", (e) => {
    if (isResizing) return;
  
    const rect = container.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
  
    container.classList.remove(
      "edge-top", "edge-bottom", "edge-left", "edge-right",
      "edge-top-left", "edge-top-right", "edge-bottom-left", "edge-bottom-right"
    );
  
    let edge = null;
    const onLeft = offsetX < EDGE_THRESHOLD;
    const onRight = offsetX > rect.width - EDGE_THRESHOLD;
    const onTop = offsetY < EDGE_THRESHOLD;
    const onBottom = offsetY > rect.height - EDGE_THRESHOLD;
  
    if (onTop && onLeft) edge = "top-left";
    else if (onTop && onRight) edge = "top-right";
    else if (onBottom && onLeft) edge = "bottom-left";
    else if (onBottom && onRight) edge = "bottom-right";
    else if (onTop) edge = "top";
    else if (onBottom) edge = "bottom";
    else if (onLeft) edge = "left";
    else if (onRight) edge = "right";
  
    if (edge) {
      container.classList.add("edge-" + edge);
      currentEdge = edge;
    } else {
      currentEdge = null;
    }
  });
  
  // Start resizing
  container.addEventListener("mousedown", (e) => {
    if (!currentEdge) return;
  
    e.preventDefault();
    e.stopPropagation(); // 🛑 Prevents triggering dragging
  
    isResizing = true;
  
    const styles = window.getComputedStyle(container);
    startX = e.clientX;
    startY = e.clientY;
    startWidth = parseFloat(styles.width);
    startHeight = parseFloat(styles.height);
    startLeft = parseFloat(styles.left);
    startTop = parseFloat(styles.top);
  
    document.addEventListener("mousemove", onResize);
    document.addEventListener("mouseup", stopResize);
    document.getElementById("editor-header").addEventListener("mousedown", startDragging);
  });
  
  // Resize logic
  function onResize(e) {
    if (!isResizing) return;
  
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
  
    let newWidth = startWidth;
    let newHeight = startHeight;
    let newLeft = startLeft;
    let newTop = startTop;
  
    // Right edge
    if (currentEdge.includes("right")) {
      newWidth = Math.max(MIN_WIDTH, startWidth + dx);
      container.style.width = newWidth + "px";
    }
  
    // Bottom edge
    if (currentEdge.includes("bottom")) {
      newHeight = Math.max(MIN_HEIGHT, startHeight + dy);
      container.style.height = newHeight + "px";
    }
  
    // Left edge
    if (currentEdge.includes("left")) {
      const proposedWidth = startWidth - dx;
      if (proposedWidth > MIN_WIDTH) {
        container.style.width = proposedWidth + "px";
        container.style.left = (startLeft + dx) + "px";
      }
    }
  
    // Top edge
    if (currentEdge.includes("top")) {
      const proposedHeight = startHeight - dy;
      if (proposedHeight > MIN_HEIGHT) {
        container.style.height = proposedHeight + "px";
        container.style.top = (startTop + dy) + "px";
      }
    }
  }
  
  // Stop resizing
  function stopResize() {
    isResizing = false;
    currentEdge = null;
    document.removeEventListener("mousemove", onResize);
    document.removeEventListener("mouseup", stopResize);
  }
});

function toggleEditor() {
  minimized = !minimized;
  const editorContainer = document.getElementById("editor-container");
  const hexagonContainer = document.querySelector(".hexagon-container");

  if (editorState === "minimized") {
    // Editor is minimized, restore it to the previous state
    if (editorState === "maximized") {
      maximizeEditor();
    } else {
      // Normal state
      editorContainer.classList.remove("hidden");
      hexagonContainer.classList.add("hidden");
      editorState = "normal";
    }
  } else {
    // Editor is visible, minimize it
    minimizeEditor();
  }

  // Ensure taskbar is always visible
  const taskbar = document.getElementById("taskbar");
  taskbar.classList.remove("hidden");
}

function createCodeEditor() {
  const editorContainer = document.getElementById("editor-container");
  codeEditor = document.getElementById("code-editor");

  const newFileIcon = document.getElementById("new-file");
  const openFileIcon = document.getElementById("open-file");
  const saveFileIcon = document.getElementById("save-file");
  const saveFileAsIcon = document.getElementById("save-file-as");
  const undoIcon = document.getElementById("undo");
  const redoIcon = document.getElementById("redo");
  const micIcon = document.getElementById("micButton");
  const closeFileIcon = document.getElementById("close-file");
  const minimizeIcon = document.getElementById("minimize");
  const maximizeIcon = document.getElementById("max");
  const boldIcon = document.getElementById("bold-text");
  const italicIcon = document.getElementById("italic-text");
  const underlineIcon = document.getElementById("underline-text");

  newFileIcon.addEventListener("click", createNewFile);
  openFileIcon.addEventListener("click", openFile);
  saveFileIcon.addEventListener("click", saveFile);
  saveFileAsIcon.addEventListener("click", saveFileAs);
  undoIcon.addEventListener("click", undo);
  redoIcon.addEventListener("click", redo);
  micIcon.addEventListener("click", speechToText);
  closeFileIcon.addEventListener("click", closeFile);
  minimizeIcon.addEventListener("click", minimizeEditor);
  maximizeIcon.addEventListener("click", max);
  boldIcon.addEventListener("click", formatBold);
  italicIcon.addEventListener("click", formatItalic);
  underlineIcon.addEventListener("click", formatUnderline);

  editorContainer.classList.remove("hidden");

  const hexagonContainer = document.querySelector(".hexagon-container");
  hexagonContainer.classList.add("hidden");

  const taskbar = document.getElementById("taskbar");
  taskbar.classList.remove("hidden"); // Show the taskbar

  // Set the editor state based on the current state
  if (editorState === "minimized") {
    minimizeEditor();
  } else if (editorState === "maximized") {
    maximizeEditor();
  } else {
    // Normal state
    editorContainer.style.width = "50%";
    editorContainer.style.height = "80%";
    editorContainer.style.top = "50%";
    editorContainer.style.left = "50%";
    editorContainer.style.transform = "translate(-50%, -50%)";
  }

  // Initialize button states
  updateSaveButton();
  updateUndoRedoButtons();

  // Modify the codeEditor input event listener to update button states
  codeEditor.addEventListener("input", function () {
    isFileSaved = false;
    codeEditor.style.backgroundColor = "lightgray";

    // Update button states
    updateSaveButton();
    updateUndoRedoButtons();
  });

  // Add keyboard event listener for undo and redo
  codeEditor.addEventListener("keydown", function (event) {
    if (event.ctrlKey && event.key === "z") {
      event.preventDefault();
      undo();
    } else if (event.ctrlKey && event.key === "y") {
      event.preventDefault();
      redo();
    }
  });

  // Add keyboard shortcuts for formatting
  document.getElementById('code-editor').addEventListener('keydown', function(event) {
    if (event.ctrlKey) {
      switch(event.key.toLowerCase()) {
        case 'b':
          event.preventDefault();
          formatBold();
          break;
        case 'i':
          event.preventDefault();
          formatItalic();
          break;
        case 'u':
          event.preventDefault();
          formatUnderline();
          break;
      }
    }
  });

  // Save changes periodically
  setInterval(saveChanges, saveInterval);
}

function updateSaveButton() {
  const saveFileIcon = document.getElementById("save-file");
  if (isFileSaved) {
    saveFileIcon.classList.add("grayed-out");
  } else {
    saveFileIcon.classList.remove("grayed-out");
  }
}

function updateUndoRedoButtons() {
  const undoIcon = document.getElementById("undo");
  const redoIcon = document.getElementById("redo");

  if (currentHistoryIndex <= 0) {
    undoIcon.classList.add("grayed-out");
  } else {
    undoIcon.classList.remove("grayed-out");
  }

  if (currentHistoryIndex >= editorHistory.length - 1) {
    redoIcon.classList.add("grayed-out");
  } else {
    redoIcon.classList.remove("grayed-out");
  }
}

function saveChanges() {
  const currentContent = codeEditor.value;
  if (currentContent !== lastSavedContent) {
    lastSavedContent = currentContent;
    editorHistory = editorHistory.slice(0, currentHistoryIndex + 1);
    editorHistory.push(currentContent);
    currentHistoryIndex = editorHistory.length - 1;

    updateUndoRedoButtons();
  }
}

function removeCodeEditor() {
  const editorContainer = document.getElementById("editor-container");
  codeEditor.value = "";
  currentFileHandle = null;
  isFileSaved = true;
  editorContainer.classList.add("hidden");

  const hexagonContainer = document.querySelector(".hexagon-container");
  hexagonContainer.classList.remove("hidden");

  const taskbar = document.getElementById("taskbar");
  taskbar.classList.add("hidden");
}

let currentUtterance = null;

function speakText(text) {
  if (currentUtterance) {
    window.speechSynthesis.cancel();
  }
  const utterance = new SpeechSynthesisUtterance(text);
  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}

async function createNewFile() {
  minimized = false;
  if (!isFileSaved) {
    const confirmMessage =
      "You have unsaved changes in the current file. They will be lost if you create a new file. Do you want to proceed?";
    speakText(confirmMessage);
    let userResponse = confirm(confirmMessage);
    window.speechSynthesis.cancel();
    if (!userResponse) {
      return false;
    }
  }
  if (codeEditor) {
    codeEditor.value = "";
  }
  createCodeEditor();
  codeEditor.style.backgroundColor = "lightgray";
  currentFileHandle = null;
  isFileSaved = true;
  // Reset editor history
  editorHistory = [""];
  currentHistoryIndex = 0;
  lastSavedContent = "";
  updateSaveButton();
  updateUndoRedoButtons();

  // Keep the editor maximized if it was previously maximized
  if (isFullScreen) {
    const editorContainer = document.getElementById("editor-container");
    editorContainer.style.width = "100vw";
    editorContainer.style.height = "100vh";
    editorContainer.style.left = "0";
    editorContainer.style.top = "0";
    editorContainer.style.transform = "none";
  }
  return true;
}

async function openFile() {
  fileManager = true;
  if (codeEditor && !isFileSaved) {
    const confirmMessage =
      "Are you sure you want to open a new file without saving the current file?";
    speakText(confirmMessage);
    const confirmOpen = confirm(confirmMessage);
    window.speechSynthesis.cancel();
    if (!confirmOpen) {
      return false;
    }
  }
  try {
    const selectedFile = await Neutralino.os.showOpenDialog();

    if (selectedFile && selectedFile.length > 0) {
      const filePath = selectedFile[0];
      const content = await Neutralino.filesystem.readFile(filePath);

      if (!codeEditor) {
        createCodeEditor();
      }

      codeEditor.value = content;
      currentFileHandle = filePath;
      codeEditor.style.backgroundColor = "white";
      isFileSaved = true;

      console.log("File opened successfully");

      // Reset editor history
      editorHistory = [content];
      currentHistoryIndex = 0;
      lastSavedContent = content;

      updateSaveButton();
      updateUndoRedoButtons();
    }
  } catch (err) {
    console.error("Failed to open file:", err);
  }
  fileManager = false;
  return true;
}

async function saveFile() {
  if (codeEditor) {
    const content = codeEditor.value;
    try {
      if (currentFileHandle) {
        await Neutralino.filesystem.writeFile(currentFileHandle, content);
        codeEditor.style.backgroundColor = "white";
        isFileSaved = true;
      } else {
        const selectedFile = await Neutralino.os.showSaveDialog();
        if (selectedFile) {
          await Neutralino.filesystem.writeFile(selectedFile, content);
          currentFileHandle = selectedFile;
          codeEditor.style.backgroundColor = "white";
          isFileSaved = true;
        }
      }

      lastSavedContent = content;
      updateSaveButton();
      updateUndoRedoButtons();
    } catch (err) {
      console.error("Failed to save file:", err);
    }
  } else {    
    const alertMessage = "No file is currently open.";    
    speakText(alertMessage);    
    beeAlert.appState(alertMessage, "File Status 📄");  
  }
}

async function saveFileAs() {
  const content = codeEditor.value;
  try {
    const selectedFile = await Neutralino.os.showSaveDialog();
    if (selectedFile) {
      await Neutralino.filesystem.writeFile(selectedFile, content);
      currentFileHandle = selectedFile;
      codeEditor.style.backgroundColor = "white";
      isFileSaved = true;

      lastSavedContent = content;
      updateSaveButton();
      updateUndoRedoButtons();
    }
  } catch (err) {
    console.error("Failed to save file:", err);
  }
}

async function closeFile() {
  if (codeEditor) {
    if (!isFileSaved) {
      const confirmMessage =
        "Are you sure you want to exit without saving the file?";
      speakText(confirmMessage);
      const confirmClose = await beeConfirm(confirmMessage, "Unsaved Changes");
      window.speechSynthesis.cancel();
      if (!confirmClose) {
        return false;
      }
    }
    removeCodeEditor();
  }
  // Reset codeEditor state
  codeEditor = false;
  return true;
}

async function undo() {
  if (currentHistoryIndex > 0) {
    currentHistoryIndex--;
    const content = editorHistory[currentHistoryIndex];
    codeEditor.value = content;
    codeEditor.style.backgroundColor = "lightgray";
    isFileSaved = false;
    lastSavedContent = content;

    updateSaveButton();
    updateUndoRedoButtons();
  }
}

async function redo() {
  if (currentHistoryIndex < editorHistory.length - 1) {
    currentHistoryIndex++;
    const content = editorHistory[currentHistoryIndex];
    codeEditor.value = content;
    codeEditor.style.backgroundColor = "lightgray";
    isFileSaved = false;
    lastSavedContent = content;

    updateSaveButton();
    updateUndoRedoButtons();
  }
}

async function speechToText() {
  // Check for browser compatibility
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    console.error("Speech recognition not supported in this browser.");
    // Optionally inform the user via UI
    beeAlert.browserCompatibility("Speech recognition is not supported in your browser.", "Feature Not Supported 🚫");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US'; // Set language
  recognition.interimResults = false; // Get final results only
  recognition.maxAlternatives = 1; // Get only the most likely result

  // Event handler for when speech recognition starts
  recognition.onstart = function() {
    console.log('Speech recognition started');
    // Optionally update mic icon or UI to indicate listening
    const micIcon = document.getElementById("micButton");
    if(micIcon) micIcon.src = "img/Microphone_On.png"; // Assuming you have an 'on' icon
  };

  // Event handler for when speech is recognized
  recognition.onresult = function(event) {
    const transcript = event.results[0][0].transcript;
    console.log('Recognized speech: ' + transcript);

    // Get the code editor element
    const codeEditor = document.getElementById("code-editor");

    if (codeEditor) {
      // Add the recognized text to the code editor
      // For contenteditable div, we can append text
      const currentContent = codeEditor.innerHTML;
      const newContent = currentContent + transcript + ' '; // Add a space after dictated text
      codeEditor.innerHTML = newContent;

      // Optional: Place cursor at the end of the added text (more complex for contenteditable)
      // For simplicity, just appending text for now.
    } else {
      console.error("Code editor element not found.");
    }
  };

  // Event handler for errors
  recognition.onerror = function(event) {
    console.error('Speech recognition error', event);
    // Optionally inform the user about the error
    beeAlert.appState("Speech recognition error: " + event.error, "Speech Error ❌");
  };

  // Event handler for when speech recognition ends
  recognition.onend = function() {
    console.log('Speech recognition ended');
    // Optionally reset mic icon or UI
    const micIcon = document.getElementById("micButton");
    if(micIcon) micIcon.src = "img/Microphone_Off.png"; // Reset to 'off' icon
  };

  // Start the recognition
  recognition.start();
}

function minimizeEditor() {
  minimized = true;
  editorState = "minimized";
  const editorContainer = document.getElementById("editor-container");
  editorContainer.classList.add("hidden");

  const hexagonContainer = document.querySelector(".hexagon-container");
  hexagonContainer.classList.remove("hidden");

  const taskbar = document.getElementById("taskbar");
  taskbar.classList.remove("hidden");
}

function maximizeEditor() {
  editorState = "maximized";
  const editorContainer = document.getElementById("editor-container");
  editorContainer.style.width = "100vw";
  editorContainer.style.height = "100vh";
  editorContainer.style.left = "0";
  editorContainer.style.top = "0";
  editorContainer.style.transform = "none";

  const hexagonContainer = document.querySelector(".hexagon-container");
  hexagonContainer.classList.add("hidden");

  const taskbar = document.getElementById("taskbar");
  taskbar.classList.add("hidden");
}

let isFullScreen = false;
let defaultWidth, defaultHeight;

function max() {
  const editorContainer = document.getElementById("editor-container");
  const taskbar = document.getElementById("taskbar");

  if (!isFullScreen) {
    // Save default dimensions if not already saved
    if (!defaultWidth && !defaultHeight) {
      defaultWidth = editorContainer.style.width;
      defaultHeight = editorContainer.style.height;
    }

    // Save current position before expanding
    const currentPositionX = parseFloat(editorContainer.style.left);
    const currentPositionY = parseFloat(editorContainer.style.top);

    // Maximize editor
    editorContainer.style.width = "100vw"; // Set width to viewport width
    editorContainer.style.height = "100vh"; // Set height to viewport height
    editorContainer.style.left = "0";
    editorContainer.style.top = "0";
    editorContainer.style.transform = "none"; // Remove transform to ensure it fits the screen

    isFullScreen = true; // Set isFullScreen to true when maximizing
  } else {
    // Restore default dimensions and position
    editorContainer.style.width = defaultWidth || "50%";
    editorContainer.style.height = defaultHeight || "80%";
    editorContainer.style.left = "50%";
    editorContainer.style.top = "50%";
    editorContainer.style.transform = "translate(-50%, -50%)";

    isFullScreen = false; // Set isFullScreen to false when restoring default dimensions
  }
}

function openCamera() {
  camera = true;
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    var constraints = { video: true };
    let cameraOpen = true;

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then(function (stream) {
        var cameraContainer = document.createElement("div");
        cameraContainer.className = "camera-container";
        cameraContainer.style.position = "fixed";
        cameraContainer.style.top = "50%";
        cameraContainer.style.left = "50%";
        cameraContainer.style.transform = "translate(-50%, -50%)";
        cameraContainer.style.width = "80%";
        cameraContainer.style.height = "80%";
        cameraContainer.style.zIndex = "9999";
        cameraContainer.style.backgroundColor = "#ffc700"; // Set background color to yellow
        cameraContainer.style.border = "2px solid black"; // Enclose in a rectangle box
        document.body.appendChild(cameraContainer);

        var videoElement = document.createElement("video");
        videoElement.srcObject = stream;
        videoElement.play();
        videoElement.style.transform = "scaleX(-1)";
        videoElement.style.width = "100%";
        videoElement.style.height = "calc(100% - 80px)"; // Adjusted height to not overlap with capture button
        videoElement.style.objectFit = "cover";
        cameraContainer.appendChild(videoElement);

        var captureButton = document.createElement("div");
        captureButton.classList.add("capture-button");
        captureButton.style.position = "absolute";
        captureButton.style.bottom = "10px";
        captureButton.style.left = "50%";
        captureButton.style.transform = "translateX(-50%)";
        captureButton.style.width = "60px";
        captureButton.style.height = "60px";
        captureButton.style.borderRadius = "50%";
        captureButton.style.backgroundColor = "white";
        captureButton.style.display = "flex";
        captureButton.style.justifyContent = "center";
        captureButton.style.alignItems = "center";
        captureButton.style.cursor = "pointer";
        cameraContainer.appendChild(captureButton);

        var captureIcon = document.createElement("img");
        captureIcon.src = "img/camera-icon.png";
        captureIcon.style.width = "40px";
        captureIcon.style.height = "40px";
        captureButton.appendChild(captureIcon);

        var exitIcon = document.createElement("img");
        exitIcon.classList.add("exit-icon");
        exitIcon.src = "img/exit-icon.png";
        exitIcon.style.position = "absolute";
        exitIcon.style.top = "20px";
        exitIcon.style.right = "20px";
        exitIcon.style.width = "30px";
        exitIcon.style.height = "30px";
        exitIcon.style.cursor = "pointer";
        cameraContainer.appendChild(exitIcon);

        var previewImage = document.createElement("img");
        previewImage.classList.add("preview-image");
        previewImage.style.display = "none";
        previewImage.style.transform = "scaleX(-1)";
        previewImage.style.width = "100%";
        previewImage.style.height = "100%";
        previewImage.style.objectFit = "cover";
        previewImage.style.cursor = "pointer";
        cameraContainer.appendChild(previewImage);

        var backIcon = document.createElement("img");
        backIcon.classList.add("back-icon");
        backIcon.src = "img/back-icon.png";
        backIcon.style.display = "none";
        backIcon.style.position = "absolute";
        backIcon.style.top = "20px";
        backIcon.style.left = "20px";
        backIcon.style.width = "30px";
        backIcon.style.height = "30px";
        backIcon.style.cursor = "pointer";
        cameraContainer.appendChild(backIcon);

        var smallPreviewImage = document.createElement("img");
        smallPreviewImage.style.display = "none";
        smallPreviewImage.style.transform = "scaleX(-1)";
        smallPreviewImage.style.position = "absolute";
        smallPreviewImage.style.bottom = "20px";
        smallPreviewImage.style.right = "20px";
        smallPreviewImage.style.width = "120px";
        smallPreviewImage.style.height = "90px";
        smallPreviewImage.style.objectFit = "cover";
        smallPreviewImage.style.border = "2px solid white";
        smallPreviewImage.style.cursor = "pointer";
        cameraContainer.appendChild(smallPreviewImage);

        captureButton.addEventListener("click", function () {
          var canvas = document.createElement("canvas");
          canvas.width = videoElement.videoWidth;
          canvas.height = videoElement.videoHeight;
          var context = canvas.getContext("2d");
      
          if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
            context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

            canvas.toBlob(async function (blob) {
              if (!blob || blob.size === 0) {
                console.error("Invalid or empty Blob created.");
                return;
              }

              try {
                // Convert Blob to Uint8Array
                const arrayBuffer = await blob.arrayBuffer();
                const uint8Array = new Uint8Array(arrayBuffer);

                // Change Directory Path to personal picure directory in local machine
                const dirPath = "Picture";

                // Create directory if it doesn't exist
                try {
                  const stats = await Neutralino.filesystem.getStats(dirPath);
                  if (!stats.isDirectory) {
                    throw new Error("Path exists but is not a directory.");
                  }
                } catch (error) {
                  // If directory does not exist, create it
                  await Neutralino.filesystem.createDirectory(dirPath);
                }
                const fileName = `${dirPath}/capture_${Date.now()}.png`;
                await Neutralino.filesystem.writeBinaryFile(
                  fileName,
                  uint8Array
                );
                console.log("Image saved successfully:", fileName);
              } catch (error) {
                console.error("Failed to save image:", error);
                beeAlert.fileError(`Failed to save image: ${error.message}`, "Camera Error 📷");
              }

              // Update preview images
              smallPreviewImage.src = URL.createObjectURL(blob);
              smallPreviewImage.style.display = "block";
              previewImage.src = URL.createObjectURL(blob);
            }, "image/png");
          } else {
            console.error(
              "Video element does not have enough data to capture."
            );
          }

        });

        smallPreviewImage.addEventListener("click", function () {
          previewImage.src = smallPreviewImage.src;
          previewImage.style.display = "block";
          videoElement.style.display = "none";
          captureButton.style.display = "none";
          smallPreviewImage.style.display = "none";
          backIcon.style.display = "block";
          exitIcon.style.display = "none";
        });

        previewImage.addEventListener("click", function () {
          previewImage.style.display = "block";
          videoElement.style.display = "none";
          captureButton.style.display = "none";
          smallPreviewImage.style.display = "none";
          backIcon.style.display = "block";
          exitIcon.style.display = "none";
        });

        backIcon.addEventListener("click", function () {
          previewImage.style.display = "none";
          videoElement.style.display = "block";
          captureButton.style.display = "flex";
          smallPreviewImage.style.display = "block";
          backIcon.style.display = "none";
          exitIcon.style.display = "block"; // Show exit button when returning to live cam
        });

        exitIcon.addEventListener("click", function () {
          camera = false;
          // Stop all tracks in the stream
          stream.getTracks().forEach(function (track) {
            track.stop();
          });

          // Remove the camera container from the DOM
          cameraContainer.parentNode.removeChild(cameraContainer);
        });
      })
      .catch(function (error) {
        console.error("Error accessing camera:", error);
        camera = false; // Reset camera state on error
        const errorMessage = "Error accessing camera.";        
        speakText(errorMessage);        
        beeAlert.fileError(errorMessage, "Camera Access Error 📷");
      });
  } else {
    camera = false; // Reset camera state if not supported
    beeAlert.browserCompatibility("getUserMedia is not supported by your browser", "Browser Compatibility 🌐");
  }
}

function openSchedulerApp() {
  window.location.href = 'scheduling-policies.html';
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Function to open the photo gallery
async function openPhotoGallery() {
  const dirPath = "Picture";

  try {
    // Check if the directory exists
    const stats = await Neutralino.filesystem.getStats(dirPath);
    if (!stats.isDirectory) throw new Error("Invalid gallery path.");

    // Read the directory contents
    const entries = await Neutralino.filesystem.readDirectory(dirPath);
    console.log("Files in directory:", entries); // Debugging: Log file list

    // Filter out only image files
    const imageFiles = entries.filter((file) => {
      const ext = file.entry.split(".").pop().toLowerCase();
      return (
        file.type === "FILE" &&
        ["png", "jpg", "jpeg", "gif", "bmp"].includes(ext)
      );
    });

    if (imageFiles.length === 0) {
      beeAlert.appState("No images found in the gallery.", "Gallery Status 🖼️");
      return;
    }

    const galleryContainer = document.createElement("div");
    galleryContainer.id = "gallery-container";
    Object.assign(galleryContainer.style, {
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "flex-start",
      alignItems: "flex-start",
      gap: "15px",
      padding: "20px",
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      position: "fixed",
      top: "0",
      left: "0",
      width: "100vw",
      height: "100vh",
      overflowY: "auto",
      zIndex: "1000",
    });

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "Close Gallery";
    Object.assign(closeBtn.style, {
      position: "fixed",
      top: "20px",
      right: "20px",
      padding: "10px 15px",
      backgroundColor: "#f44336",
      color: "white",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
      zIndex: "1001",
    });
    closeBtn.onclick = () => document.body.removeChild(galleryContainer);
    galleryContainer.appendChild(closeBtn);

    for (const { entry } of imageFiles) {
      const filePath = `${dirPath}/${entry}`;
      try {
        const arrayBuffer = await Neutralino.filesystem.readBinaryFile(
          filePath
        );
        const base64 = arrayBufferToBase64(arrayBuffer); // ✅ Proper conversion

        const extension = entry.split(".").pop().toLowerCase();
        const mimeTypeMap = {
          png: "image/png",
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
          gif: "image/gif",
          bmp: "image/bmp",
        };
        const mimeType = mimeTypeMap[extension] || "image/png";

        // Debugging logs
        console.log(`📁 File: ${entry}`);
        console.log(`🔠 MIME Type: ${mimeType}`);
        console.log(`🧬 Base64 Snippet: ${base64.slice(0, 50)}...`);
        console.log(
          `🖼 Image SRC: data:${mimeType};base64,${base64.slice(0, 50)}...`
        );

        const img = document.createElement("img");
        img.src = `data:${mimeType};base64,${base64}`;

        Object.assign(img.style, {
          width: "120px",
          height: "90px",
          objectFit: "cover",
          cursor: "pointer",
          border: "2px solid #ccc",
          borderRadius: "4px",
        });

        img.alt = entry;
        img.title = entry;
        img.addEventListener("click", () => viewFullImage(img.src));
        galleryContainer.appendChild(img);
      } catch (err) {
        console.error(`❌ Failed to load ${entry}:`, err);
      }
    }

    document.body.appendChild(galleryContainer);
  } catch (error) {
    console.error("Photo gallery error:", error);
    beeAlert.fileError("Take a picture to create Gallery" + error.message, "Gallery Error 🖼️");
  }
}

// Function to view a full-size image
function viewFullImage(imagePath) {
  const overlay = document.createElement("div");
  Object.assign(overlay.style, {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1002,
  });

  const img = document.createElement("img");
  img.src = imagePath;
  img.alt = "Full view";
  Object.assign(img.style, {
    maxWidth: "90%",
    maxHeight: "90%",
    border: "4px solid white",
    borderRadius: "8px",
    boxShadow: "0 0 20px rgba(0,0,0,0.7)",
  });

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "×";
  Object.assign(closeBtn.style, {
    position: "absolute",
    top: "20px",
    right: "20px",
    fontSize: "32px",
    color: "white",
    background: "none",
    border: "none",
    cursor: "pointer",
    zIndex: "1003",
  });
  closeBtn.onclick = () => document.body.removeChild(overlay);

  overlay.appendChild(img);
  overlay.appendChild(closeBtn);
  document.body.appendChild(overlay);
}

// Open the photo gallery when the button is clicked
async function openGallery() {
  const dirPath = "Picture";

  try {
    const stats = await Neutralino.filesystem.getStats(dirPath);
    if (!stats.isDirectory) throw new Error("Invalid gallery path.");

    const entries = await Neutralino.filesystem.readDirectory(dirPath);

    const imageFiles = entries.filter(file => {
      const ext = file.entry.split(".").pop().toLowerCase();
      return file.type === "FILE" && ["png", "jpg", "jpeg", "gif", "bmp"].includes(ext);
    });

    if (imageFiles.length === 0) {    
      beeAlert.appState("No images found in the gallery.", "Gallery Status 🖼️");      
      return;    
    }

    const galleryContainer = document.getElementById("gallery-images");
    galleryContainer.innerHTML = ""; // Clear existing images first

    for (const { entry } of imageFiles) {
      const filePath = `${dirPath}/${entry}`;
      try {
        const arrayBuffer = await Neutralino.filesystem.readBinaryFile(filePath);
        const base64 = arrayBufferToBase64(arrayBuffer);

        const extension = entry.split(".").pop().toLowerCase();
        const mimeTypeMap = {
          png: "image/png",
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
          gif: "image/gif",
          bmp: "image/bmp"
        };
        const mimeType = mimeTypeMap[extension] || "image/png";

        const img = document.createElement("img");
        img.src = `data:${mimeType};base64,${base64}`;
        img.alt = entry;
        img.title = entry;

        // Add click event listener to open full image view
        img.addEventListener("click", function() {
          viewFullImage(img.src);
        });

        galleryContainer.appendChild(img);
      } catch (err) {
        console.error(`❌ Failed to load ${entry}:`, err);
      }
    }

    document.getElementById("gallery-modal").classList.remove("hidden");
  } catch (error) {    
    console.error("Photo gallery error:", error);    
    beeAlert.fileError("Take a picture to create gallery", "Gallery Error 🖼️");  
  }
}

function closeGallery() {
  document.getElementById("gallery-modal").classList.add("hidden");
}

function shutdown() {  
  console.log("Shutdown button clicked");  
  
  // Check if interfaces are actually visible rather than just boolean variables
  const editorVisible = document.getElementById("editor-container") && !document.getElementById("editor-container").classList.contains("hidden");
  const cameraVisible = document.querySelector(".camera-container") !== null;
  const musicPlayerVisible = document.getElementById("music-player-container") && !document.getElementById("music-player-container").classList.contains("hidden");
  
  if (editorVisible || cameraVisible || musicPlayerVisible) {    
    speakText("Some tabs are open. Close them first.");    
    beeAlert.appState("Some tabs are open. Close them first.", "Application State 📋");  
  } else {    
    speakText("Are you sure you want to shut down?");    
    beeAlert.shutdownConfirm("Are you sure you want to shut down Honey OS?").then((confirmed) => {      
      window.speechSynthesis.cancel();      
      
      if (confirmed) {        
        // Just redirect — shutdown.html will handle the animation and app.exit        
        window.location.href = "shutdown.html";      
      }    
    });  
  }
}
const shutdownButton = document.getElementById("shutdown-button");
shutdownButton.addEventListener("click", shutdown);

let isDragging = false;
let initialMouseX, initialMouseY;
let initialEditorX, initialEditorY;

document
  .getElementById("editor-container")
  .addEventListener("mousedown", startDragging);
document.addEventListener("mousemove", drag);
document.addEventListener("mouseup", stopDragging);

function startDragging(event) {
  isDragging = true;
  initialMouseX = event.clientX;
  initialMouseY = event.clientY;
  const editorContainer = document.getElementById("editor-container");
  const style = window.getComputedStyle(editorContainer);
  initialEditorX = parseFloat(style.left);
  initialEditorY = parseFloat(style.top);
}

function drag(event) {
  if (!isDragging) return;
  const dx = event.clientX - initialMouseX;
  const dy = event.clientY - initialMouseY;
  const editorContainer = document.getElementById("editor-container");
  editorContainer.style.left = initialEditorX + dx + "px";
  editorContainer.style.top = initialEditorY + dy + "px";
}

function stopDragging() {
  isDragging = false;
}

const codeEditorElement = document.getElementById("code-editor");
if (codeEditorElement) {
  codeEditorElement.addEventListener("mousedown", function (event) {
    event.stopPropagation();
  });
}

window.onload = function () {
  const container = document.getElementById("hexagon-container7");
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  const hexWidth = 100; // Width of hexagon
  const hexHeight = 78; // Height of hexagon
  const hexMarginX = 0; // Horizontal margin between hexagons
  const hexMarginY = 20; // Vertical margin between hexagons
  const sideLength = hexHeight / 2;
  let isDarkMode = false; // Flag to track the mode

  // Function to toggle mode
  // Function to toggle mode
  function toggleMode() {
    const body = document.body;
    const drawer = document.querySelector(".drawer");
    isDarkMode = !isDarkMode;
    body.classList.toggle("light-mode", !isDarkMode); // Add light-mode class if not in dark mode
    body.classList.toggle("dark-mode", isDarkMode); // Add dark-mode class if in dark mode

    // Update hexagon colors based on mode
    const hexagons = document.querySelectorAll(".hexagon7");
    hexagons.forEach((hexagon) => {
      hexagon.classList.toggle("light-mode-hexagon", !isDarkMode);
      hexagon.classList.toggle("dark-mode-hexagon", isDarkMode);
    });

    // Update button text
    const modeToggleButton = document.getElementById("mode-toggle-button");
    modeToggleButton.textContent = isDarkMode ? "" : "Light Mode";
  }

  // function shutdown() {
  //     Neutralino.app.exit();
  // }

  // Update drawer background color based on mode
  if (isDarkMode) {
    drawer.style.setProperty("background-color", "#1f1f1f");
  } else {
    drawer.style.removeProperty("background-color");
  }

  // Calculate the number of hexagons in a row and column
  const hexagonsPerRow =
    Math.ceil(screenWidth / (sideLength * 3 + hexMarginX)) + 1;
  const numRows = Math.ceil(screenHeight / (hexHeight + hexMarginY)) + 1;

  // Calculate the number of hexagons to fill the left side of the screen
  const numHexagonsLeft = Math.ceil(screenWidth / (hexWidth + hexMarginX));

  // Calculate the number of hexagons to fill the top of the screen
  const numHexagonsTop = Math.ceil(screenHeight / (hexHeight + hexMarginY));

  // Generate hexagons
  for (let row = 0; row < numRows + numHexagonsTop; row++) {
    for (let col = 0; col < hexagonsPerRow + numHexagonsLeft; col++) {
      const hexagon = document.createElement("div");
      hexagon.classList.add("hexagon7");
      const x =
        col * (sideLength * 3 + hexMarginX) -
        numHexagonsLeft * (hexWidth + hexMarginX) +
        (row % 2) * (sideLength * 1.5 + hexMarginX);
      const y =
        row * (hexHeight + hexMarginY) -
        numHexagonsTop * (hexHeight + hexMarginY);
      hexagon.style.left = `${x}px`;
      hexagon.style.top = `${y}px`;
      container.appendChild(hexagon);
    }
  }

  // Event listener for button click to toggle mode
  const toggleButton = document.getElementById("toggle-button");
  toggleButton.addEventListener("click", toggleMode);
};

function openMusic() {
  openMusicPlayer();
}

function openMusicPlayer() {
  musicPlayer = true;
  const musicPlayerContainer = document.getElementById(
    "music-player-container"
  );
  const hexagonContainer = document.querySelector(".hexagon-container");

  if (musicPlayerContainer) musicPlayerContainer.classList.remove("hidden");
  if (hexagonContainer) hexagonContainer.classList.add("hidden");

  // Query and assign music player UI elements here, after the container is shown
  now_playing = document.querySelector(".now-playing");
  track_art = document.querySelector(".track-art");
  track_name = document.querySelector(".track-name");
  track_artist = document.querySelector(".track-artist");

  playpause_btn = document.querySelector(".playpause-track");
  next_btn = document.querySelector(".next-track");
  prev_btn = document.querySelector(".prev-track");

  seek_slider = document.querySelector(".seek_slider");
  volume_slider = document.querySelector(".volume_slider");
  curr_time = document.querySelector(".current-time");
  total_duration = document.querySelector(".total-duration");

  // Attach events
  seek_slider.addEventListener("change", seekTo);
  volume_slider.addEventListener("input", setVolume);

  // Load the current track when the music player is opened
  loadTrack(track_index);
}

function closeMusicPlayer() {
  if (isPlaying) {
    pauseTrack();
  }
  musicPlayer = false;
  const musicPlayerContainer = document.getElementById("music-player-container");
  const hexagonContainer = document.querySelector(".hexagon-container");

  if (musicPlayerContainer) musicPlayerContainer.classList.add("hidden");
  if (hexagonContainer) hexagonContainer.classList.remove("hidden");
}

function random_bg_color() {
  // Get a number between 64 to 256 (for getting lighter colors)
  let red = Math.floor(Math.random() * 256) + 64;
  let green = Math.floor(Math.random() * 256) + 64;
  let blue = Math.floor(Math.random() * 256) + 64;

  // Calculate the brightness of the color
  let brightness = Math.round(
    (parseInt(red) * 299 + parseInt(green) * 587 + parseInt(blue) * 114) / 1000
  );

  // If the color is light (i.e., brightness > 125), decrease each color component by 64 to make it darker
  if (brightness > 125) {
    red -= 64;
    green -= 64;
    blue -= 64;
  }

  // Construct a color with the given values
  let bgColor = "rgb(" + red + "," + green + "," + blue + ")";

  // Set the background to that color
  let musicPlayerContainer = document.querySelector("#music-player-container");
  if (musicPlayerContainer) {
    musicPlayerContainer.style.background = bgColor;
  }
}

loadTrack(track_index);

function loadTrack(index) {
  clearInterval(updateTimer);
  resetValues();

  curr_track.src = track_list[index].path;
  curr_track.load();

  curr_track.addEventListener("loadedmetadata", () => {
    seek_slider.max = Math.floor(curr_track.duration);
    total_duration.textContent = formatTime(curr_track.duration);
  });

  curr_track.addEventListener("timeupdate", updateSeek);

  track_art.style.backgroundImage = `url(${track_list[index].image})`;
  track_name.textContent = track_list[index].name;
  track_artist.textContent = track_list[index].artist;
  now_playing.textContent = `PLAYING ${index + 1} OF ${track_list.length}`;

  curr_track.addEventListener("ended", nextTrack);

  random_bg_color();
}

function resetValues() {
  if (curr_time) curr_time.textContent = "00:00";
  if (total_duration) total_duration.textContent = "00:00";
  if (seek_slider) seek_slider.value = 0;
}

function playpauseTrack() {
  if (!isPlaying) playTrack();
  else pauseTrack();
}

function playTrack() {
  curr_track.play();
  isPlaying = true;
  playpause_btn.innerHTML = '<i class="fa fa-pause-circle fa-5x"></i>';
}

function pauseTrack() {
  curr_track.pause();
  isPlaying = false;
  playpause_btn.innerHTML = '<i class="fa fa-play-circle fa-5x"></i>';
}

function nextTrack() {
  track_index = (track_index + 1) % track_list.length;
  loadTrack(track_index);
  playTrack();
}

function prevTrack() {
  track_index = (track_index - 1 + track_list.length) % track_list.length;
  loadTrack(track_index);
  playTrack();
}

function seekTo() {
  curr_track.currentTime = seek_slider.value;
}

function setVolume() {
  curr_track.volume = volume_slider.value / 100;
}

function updateSeek() {
  if (!isNaN(curr_track.duration)) {
    if (seek_slider) seek_slider.value = Math.floor(curr_track.currentTime);

    if (curr_time) curr_time.textContent = formatTime(curr_track.currentTime);
    if (total_duration) total_duration.textContent = formatTime(curr_track.duration);
  }
}

function formatTime(seconds) {
  let minutes = Math.floor(seconds / 60);
  let secs = Math.floor(seconds % 60);
  if (minutes < 10) minutes = "0" + minutes;
  if (secs < 10) secs = "0" + secs;
  return `${minutes}:${secs}`;
}

function formatBold() {
  document.execCommand('bold', false, null);
  updateFormatButtonState('bold-text');
  isFileSaved = false;
  updateSaveButton();
}

function formatItalic() {
  document.execCommand('italic', false, null);
  updateFormatButtonState('italic-text');
  isFileSaved = false;
  updateSaveButton();
}

function formatUnderline() {
  document.execCommand('underline', false, null);
  updateFormatButtonState('underline-text');
  isFileSaved = false;
  updateSaveButton();
}

function updateFormatButtonState(buttonId) {
  const button = document.getElementById(buttonId);
  const command = buttonId.split('-')[0];
  const isActive = document.queryCommandState(command);
  
  if (isActive) {
    button.classList.add('format-active');
  } else {
    button.classList.remove('format-active');
  }
}

// Add event listeners for formatting buttons
document.getElementById('bold-text').addEventListener('click', formatBold);
document.getElementById('italic-text').addEventListener('click', formatItalic);
document.getElementById('underline-text').addEventListener('click', formatUnderline);

// Update button states when selection changes
document.getElementById('code-editor').addEventListener('mouseup', function() {
  updateFormatButtonState('bold-text');
  updateFormatButtonState('italic-text');
  updateFormatButtonState('underline-text');
});

document.getElementById('code-editor').addEventListener('keyup', function() {
  updateFormatButtonState('bold-text');
  updateFormatButtonState('italic-text');
  updateFormatButtonState('underline-text');
});

function openReplacementAlgo() {
    window.location.href = 'replacement-algo.html';
}
