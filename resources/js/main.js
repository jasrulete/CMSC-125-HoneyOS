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

function onWindowClose() {
  Neutralino.app.exit();
}

Neutralino.init();
Neutralino.events.on("windowClose", onWindowClose);

document.addEventListener("DOMContentLoaded", function () {
  setTimeout(function () {
    const splashScreen = document.getElementById("splash-screen");
    splashScreen.style.transition = "opacity 1s ease-out";
    splashScreen.style.opacity = 0;
    setTimeout(function () {
      window.location.href = "index2.html";
    }, 1000);
  }, 10000);

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
    alert(alertMessage);
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
      const confirmClose = confirm(confirmMessage);
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

async function speechToText() {}

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
                const dirPath = "C:/Temp/camPics";

                // Create directory if it doesn't exist
                try {
                  const stats = await Neutralino.filesystem.getStats(dirPath);
                  if (!stats.isDirectory) {
                    throw new Error("Path exists but is not a directory.");
                  }
                  console.log("Directory already exists.");
                  // console.log("Attempting to create directory:", dirPath);
                  // await Neutralino.filesystem.createDirectory(dirPath);
                  // console.log("Directory created successfully.");
                } catch (dirError) {
                  if (error.code === "NE_FS_NOPATHE") {
                    console.log("Directory does not exist. Creating...");
                    await Neutralino.filesystem.createDirectory(dirPath);
                  } else {
                    throw error;
                  }
                }

                const fileName = `${dirPath}/capture_${Date.now()}.png`;
                await Neutralino.filesystem.writeBinaryFile(
                  fileName,
                  uint8Array
                );
                console.log("Image saved successfully:", fileName);
              } catch (error) {
                console.error("Failed to save image:", error);
                alert(`Failed to save image: ${error.message}`);
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
        const errorMessage = "Error accessing camera.";
        speakText(errorMessage);
        alert(errorMessage);
      });
  } else {
    alert("getUserMedia is not supported by your browser");
  }
}

async function shutdown() {
  if (codeEditor || camera) {
    const alertMessage = "Some tabs are open. Close them first.";
    speakText(alertMessage);
    alert(alertMessage);
  } else {
    const confirmMessage = "Are you sure you want to shut down?";
    speakText(confirmMessage);
    const confirmed = window.confirm(confirmMessage);
    window.speechSynthesis.cancel();

    // If user confirms, proceed with shutdown process
    if (confirmed) {
      // Load shutdown.html dynamically
      const xhr = new XMLHttpRequest();
      xhr.open("GET", "shutdown.html", true);
      xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
          // Create a div element and set its innerHTML to the content of shutdown.html
          const div = document.createElement("div");
          div.innerHTML = xhr.responseText;
          // Set styles for the div
          div.style.position = "fixed";
          div.style.top = "0";
          div.style.left = "0";
          div.style.width = "100%";
          div.style.height = "100%";
          div.style.backgroundColor = "rgba(0,0,0)";
          div.style.zIndex = "9999";
          div.style.display = "flex";
          div.style.justifyContent = "center";
          div.style.alignItems = "center";
          // Append the div to the body
          document.body.appendChild(div);

          // // Play the sound
          // const audio = new Audio("sfx/shutdown.mp3"); // Replace 'path/to/sound.mp3' with the actual path to your sound file
          // audio.play();

          // Set a timeout to execute Neutralino.app.exit() after 5 seconds
          setTimeout(function () {
            // Remove the shutdown splash screen
            div.parentNode.removeChild(div);
            // Exit the application
            Neutralino.app.exit();
          }, 4000); // 5000 milliseconds = 5 seconds
        }
      };
      xhr.send();
    }
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

document
  .getElementById("code-editor")
  .addEventListener("mousedown", function (event) {
    event.stopPropagation();
  });

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

  const shutdownButton = document.getElementById("shutdown-button");
  shutdownButton.addEventListener("click", shutdown);
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

  musicPlayerContainer.classList.remove("hidden");
  hexagonContainer.classList.add("hidden");
}

function closeMusicPlayer() {
  if (isPlaying) {
    pauseTrack(); // Pause the currently playing track
  }
  musicPlayer = false;
  const musicPlayerContainer = document.getElementById(
    "music-player-container"
  );
  const hexagonContainer = document.querySelector(".hexagon-container");

  musicPlayerContainer.classList.add("hidden");
  hexagonContainer.classList.remove("hidden");
}

let now_playing = document.querySelector(".now-playing");
let track_art = document.querySelector(".track-art");
let track_name = document.querySelector(".track-name");
let track_artist = document.querySelector(".track-artist");

let playpause_btn = document.querySelector(".playpause-track");
let next_btn = document.querySelector(".next-track");
let prev_btn = document.querySelector(".prev-track");

let seek_slider = document.querySelector(".seek_slider");
let volume_slider = document.querySelector(".volume_slider");
let curr_time = document.querySelector(".current-time");
let total_duration = document.querySelector(".total-duration");

let track_index = 0;
let isPlaying = false;
let updateTimer;

// Create new audio element
let curr_track = document.createElement("audio");

// Define the tracks that have to be played
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

function loadTrack(track_index) {
  clearInterval(updateTimer);
  resetValues();
  curr_track.src = track_list[track_index].path;

  curr_track.addEventListener("loadedmetadata", function () {
    seek_slider.max = curr_track.duration;
    total_duration.textContent = formatTime(curr_track.duration);
  });

  curr_track.addEventListener("timeupdate", updateSeekSlider);

  track_art.style.backgroundImage =
    "url(" + track_list[track_index].image + ")";
  track_name.textContent = track_list[track_index].name;
  track_artist.textContent = track_list[track_index].artist;
  now_playing.textContent =
    "PLAYING " + (track_index + 1) + " OF " + track_list.length;

  curr_track.addEventListener("ended", nextTrack);
  random_bg_color();
}

function formatTime(seconds) {
  let minutes = Math.floor(seconds / 60);
  seconds = Math.floor(seconds % 60);
  if (minutes < 10) {
    minutes = "0" + minutes;
  }
  if (seconds < 10) {
    seconds = "0" + seconds;
  }
  return minutes + ":" + seconds;
}

function resetValues() {
  curr_time.textContent = "00:00";
  total_duration.textContent = "00:00";
  seek_slider.value = 0;
}

// Load the first track in the tracklist
loadTrack(track_index);

function playpauseTrack() {
  if (curr_track.paused) {
    curr_track.play();
    isPlaying = true;
    playpause_btn.innerHTML = '<i class="fa fa-pause-circle fa-5x"></i>';
  } else {
    curr_track.pause();
    isPlaying = false;
    playpause_btn.innerHTML = '<i class="fa fa-play-circle fa-5x"></i>';
  }
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
  if (track_index < track_list.length - 1) track_index += 1;
  else track_index = 0;
  loadTrack(track_index);
  playTrack();
}

function prevTrack() {
  if (track_index > 0) track_index -= 1;
  else track_index = track_list.length - 1;
  loadTrack(track_index);
  playTrack();
}

function seekTo() {
  let seekto = curr_track.duration * (seek_slider.value / 100);
  curr_track.currentTime = seekto;
}

function setVolume() {
  curr_track.volume = volume_slider.value / 100;
}

function updateSeekSlider() {
  let seekPosition = 0;

  if (!isNaN(curr_track.duration)) {
    seekPosition = curr_track.currentTime * (100 / curr_track.duration);
    seek_slider.value = seekPosition;

    let currentMinutes = Math.floor(curr_track.currentTime / 60);
    let currentSeconds = Math.floor(
      curr_track.currentTime - currentMinutes * 60
    );
    let durationMinutes = Math.floor(curr_track.duration / 60);
    let durationSeconds = Math.floor(
      curr_track.duration - durationMinutes * 60
    );

    if (currentSeconds < 10) {
      currentSeconds = "0" + currentSeconds;
    }
    if (durationSeconds < 10) {
      durationSeconds = "0" + durationSeconds;
    }
    if (currentMinutes < 10) {
      currentMinutes = "0" + currentMinutes;
    }
    if (durationMinutes < 10) {
      durationMinutes = "0" + durationMinutes;
    }

    curr_time.textContent = currentMinutes + ":" + currentSeconds;
    total_duration.textContent = durationMinutes + ":" + durationSeconds;
  }
}

seek_slider.addEventListener("input", seekTo);
