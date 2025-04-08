// voice.js
let recognition;
let audioContext;
let analyser;
let microphone;
let animationFrameId;

// Function to handle the voice commands
function handleVoiceCommand(command) {
  if (command.includes("open text editor") || (command.includes("open text editor"))) {
    if (codeEditor) {
      speakText("Text Editor is already open.");
    } else {
      createNewFile();
      speakText("Opening Text Editor");
    }
  } else if (command.includes("file explorer")) {
    if (fileManager) {
      speakText("File Manager is already open");
    } else {
      openFile();
      speakText("Opening File Explorer.");
    }
  } else if (command.includes("camera")) {
    if (command.includes("open")) {
      if (camera) {
        speakText("Camera is already open");
      } else {
        openCamera();
        speakText("Opening Camera.");
      }
    } else if (command.includes("close") || command.includes("exit")) {
      if (camera) {
        const exitIcon = document.querySelector(".exit-icon");
        if (exitIcon) {
          exitIcon.click();
          speakText("Closing the camera.");
        }
      } else {
        speakText("The camera is not open.");
      }
    }
  } else if (command.includes("capture") || command.includes("take a picture")) {
    if (camera) {
      const captureButton = document.querySelector(".capture-button");
      if (captureButton) {
        captureButton.click();
        speakText("Image captured.");
      }
    } else {
      speakText("Open the camera first.");
    }
  } else if (command.includes("show photo") || command.includes("show preview")) {
    if (camera) {
      const smallPreviewImage = document.querySelector(".preview-image");
      if (smallPreviewImage) {
        smallPreviewImage.click();
        speakText("Displaying image preview.");
      } else {
        speakText("No image captured yet.");
      }
    } else {
      speakText("Open the camera first.");
    }
  } else if (command.includes("go back") || command.includes("return")) {
    if (camera) {
      const backIcon = document.querySelector(".back-icon");
      if (backIcon) {
        backIcon.click();
        speakText("Returning to live camera.");
      }
    } else {
      speakText("Open the camera first.");
    }
  }else if (command.includes("music player")) {
    if (command.includes("open")) {
      if (musicPlayer) {
        speakText("Music Player is already open");
      } else {
        openMusic();
        speakText("Opening Music Player.");
      }
    } else if (command.includes("close") || command.includes("exit")) {
      if (musicPlayer) {
        closeMusicPlayer();
        speakText("Closing Music Player.");
      } else {
        speakText("Music Player is not open.");
      }
    }
  } else if (command.includes("play") && !command.includes("player")) {
    if (musicPlayer) {
      playTrack();
      speakText("Playing the song now.");
    } else {
      speakText("Open Music Player first.");
    }
  } else if (command.includes("pause") && !command.includes("player")) {
    if (musicPlayer) {
      pauseTrack();
      speakText("Pausing the song.");
    } else {
      speakText("Open Music Player first.");
    }
  } else if (command.includes("next song") || command.includes("skip")) {
    if (musicPlayer) {
      nextTrack();
      speakText("Playing next song.");
    } else {
      speakText("Open Music Player first.");
    }
  } else if (command.includes("previous song") || command.includes("go back")) {
    if (musicPlayer) {
      prevTrack();
      speakText("Playing previous song.");
    } else {
      speakText("Open Music Player first.");
    }
  } else if (command.includes("new file")) {
    if (codeEditor) {
      createNewFile().then((result) => {
        if (result) {
          speakText("Creating a new file.");
        } else {
          speakText("Cancelled creating a new file.");
        }
      });
    } else {
      speakText("Open Text Editor first.");
    }
  } else if (command.includes("open file")) {
    if (codeEditor) {
      openFile().then((result) => {
        if (result) {
          speakText("Opening a file.");
        } else {
          speakText("Cancelled opening a file.");
        }
      });
    } else {
      speakText("Open Text Editor first.");
    }
  } else if (command.includes("save file")) {
    if (codeEditor) {
      if (isFileSaved) {
        speakText("Please make some changes before saving");
      } else {
        saveFile();
        speakText("Saving the file.");
      }
    } else {
      speakText("Open Text Editor first.");
    }
  } else if (command.includes("save the file as")) {
    //save as {dili niya mapick up ang save as, save as file, save file as, save as new file}
    if (codeEditor) {
      saveFileAs();
      speakText("Saving as a new file");
    } else {
      speakText("Open Text Editor first.");
    }
  } else if (command.includes("undo")) {
    if (codeEditor) {
      if (currentHistoryIndex <= 0) {
        speakText("Cannot undo");
      } else {
        undo();
        speakText("Undo done");
      }
    } else {
      speakText("Open Text Editor first.");
    }
  } else if (command.includes("redo")) {
    if (codeEditor) {
      if (currentHistoryIndex >= editorHistory.length - 1) {
        speakText("Cannot redo");
      } else {
        redo();
        speakText("Redo done");
      }
    } else {
      speakText("Open Text Editor first.");
    }
  } else if (command.includes("start microphone")) {
    if (codeEditor) {
      speakText("Speech to text is enabled in text editor.");
      setTimeout(enableSpeechToText, 2000); // Delay execution by 3 seconds
    } else {
      speakText("Open Text Editor first.");
    }
  // } else if (command.includes("stop microphone")) {
  //   if (codeEditor) {
  //     stopSpeechToText();
  //     speakText("Stopping speech to text in the text editor.");
  //   } else {
  //     speakText("Open Text Editor first.");
  //   }
  } else if (command.includes("minimize")) {
    if (codeEditor) {
      if (minimized) {
        speakText("Text Editor is minimized");
      } else {
        minimizeEditor();
        speakText("Minimizing Text Editor");
      }
    } else {
      speakText("Open Text Editor first.");
    }
  } else if (command.includes("toggle editor")) {
    if (codeEditor && minimized) {
      toggleEditor();
      speakText("Toggling the text editor");
    } 
    else if (codeEditor && !minimized) {
      toggleEditor();
      speakText("Toggling the text editor");
    }
    else {
      speakText("Open Text Editor first.");
    }
  } else if (command.includes("resize")) {
    if (codeEditor) {
      if (minimized) {
        speakText("Text Editor is already minimized");
      } else {
        max();
        speakText("Resizing Text Editor");
      }
    } else {
      speakText("Open Text Editor first.");
    }
  } else if (command.includes("close text editor") || (command.includes("close the text editor"))) {
    if (codeEditor) {
      closeFile().then((result) => {
        if (result) {
          speakText("Closing Text Editor");
        } else {
          speakText("Cancelled closing Text Editor");
        }
      });
    } else {
      speakText("Text Editor is not open.");
    }
  } else if (command.includes("switch mode")) {
    toggleMode();
    speakText("Switching the mode");
  } else if (command.includes("shut down")) {
    if (codeEditor || camera) {
      speakText("Some tabs are open. Close them first");
    } else {
      // speakText("Goodbye honey.");
      setTimeout(function () {
        shutdown();
      }, 2000);
    }
  }
}

// Function to initialize audio visualization
function initAudioVisualization() {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyser);
      visualizeAudio();
    })
    .catch(err => {
      console.error('Error accessing microphone:', err);
    });
}

// Function to visualize audio
function visualizeAudio() {
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  
  function draw() {
    animationFrameId = requestAnimationFrame(draw);
    analyser.getByteFrequencyData(dataArray);
    
    const bars = document.querySelectorAll('#audio-visualizer .bar');
    if (!bars.length) return;

    // Get frequency data for different ranges
    const barCount = bars.length;
    const step = Math.floor(bufferLength / barCount);
    
    bars.forEach((bar, index) => {
      // Get average frequency for this bar's range
      let sum = 0;
      const start = index * step;
      for (let i = 0; i < step; i++) {
        sum += dataArray[start + i];
      }
      const average = sum / step;
      
      // Map the average to a height between 2px and 50px
      const height = Math.max(2, Math.min(50, (average / 128) * 50));
      bar.style.height = `${height}px`;
    });
  }
  
  draw();
}

// Function to stop audio visualization
function stopAudioVisualization() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  if (microphone) {
    microphone.disconnect();
    microphone = null;
  }
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
  const bars = document.querySelectorAll('#audio-visualizer .bar');
  bars.forEach(bar => {
    bar.style.height = '2px';
  });
}

// Function to start voice recognition
function startVoiceRecognition() {
  recognition = new webkitSpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;
  recognition.continuous = true;

  recognition.onstart = function () {
    console.log("Voice recognition started.");
    displayMessage("Listening...");
    playSound("sfx/start-sound.mp3");
    initAudioVisualization();
  };

  recognition.onresult = function (event) {
    const command = event.results[event.results.length - 1][0].transcript;
    if (command.toLowerCase().includes("hey honey")) {
      const extractedCommand = command
        .toLowerCase()
        .replace("hey honey", "")
        .trim();

      if (extractedCommand.endsWith("please")) {
        const finalCommand = extractedCommand.slice(0, -6).trim(); // Remove "please" from the command
        handleVoiceCommand(finalCommand);
      }
    }
  };

  recognition.onerror = function (event) {
    console.error("Voice recognition error:", event.error);
    displayMessage("Voice recognition for commands is stopped.");
    // playSound("sfx/error-sound.mp3");
  };

  recognition.onend = function () {
    console.log("Voice recognition ended.");
    recognition.start(); // Restart voice recognition after it ends
  };

  recognition.start();
}

// Function to stop voice recognition
function stopVoiceRecognition() {
  if (recognition) {
    recognition.stop();
    recognition = null;
    displayMessage("Voice recognition stopped");
    stopAudioVisualization();
  }
}

// Function to enable speech-to-text
function enableSpeechToText() {
  if ("webkitSpeechRecognition" in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = function (event) {
      var result = event.results[event.results.length - 1][0].transcript + " ";
      if (!result.toLowerCase().includes("hey honey")) {
        var textarea = document.getElementById("code-editor");
        textarea.value += result;
        textarea.style.backgroundColor = "lightgray";
        isFileSaved = false;
        updateSaveButton();
      }
    };

    recognition.onerror = function (event) {
      console.error("Speech recognition error:", event.error);
      displayMessage("Speech recognition stopped.");
      // playSound("sfx/error-sound.mp3");
      stopSpeechToText(); // Stop speech-to-text on error
    };

    recognition.onend = function () {
      console.log("Speech recognition ended.");
      // Restart speech-to-text if it's not explicitly stopped
      if (recognition) {
        recognition.start();
      }
    };

    recognition.start();
  } else {
    alert("Speech recognition is not supported in this browser.");
  }
}


// Function to stop speech-to-text in the code editor
function stopSpeechToText() {
  if (recognition) {
    recognition.stop();
    recognition = null;
  }
}

document
  .getElementById("micButton")
  .addEventListener("click", enableSpeechToText);

// Function to toggle voice recognition
function toggleVoiceRecognition() {
  const toggleButton = document.getElementById("voice-toggle");

  if (recognition) {
    stopVoiceRecognition();
    toggleButton.textContent = "";
  } else {
    startVoiceRecognition();
    toggleButton.textContent = "";
    displayMessage('Listening... Say "Hey Honey" followed by a command and end with "please".');
  }
}

// Function to display a message
function displayMessage(message) {
  const messageElement = document.getElementById("voice-message");
  if (messageElement) {
    messageElement.textContent = message;
  }
}

// Function to play a sound
function playSound(soundFile) {
  const audio = new Audio(soundFile);
  audio.play();
}

// Function to speak text with a specific voice
// Function to speak text with Microsoft Zira voice
function speakText(text) {
  speechSynthesis.speak(text, {
    voice: 'Microsoft Zira Desktop - English (United States)',
    keepAliveOnThreadDetach: true,
  });
}
// Add event listener to the voice recognition toggle button
document
  .getElementById("voice-toggle")
  .addEventListener("click", toggleVoiceRecognition);
