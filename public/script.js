import { NES, Devices } from "../src/index.js";

const statusOutput = document.getElementById('status');

function updateStatus(text) {
    statusOutput.innerText = text;
}
updateStatus("Initializing...");

try {
    const nes = new NES();

    //-------------------------------------------------------------------------------------------//
    const frontLED = document.getElementById('front_led');

    const updateFrontLED = () => {
        frontLED.classList.remove("on", "off", "paused");
        frontLED.classList.add(nes.frontLEDState);
    };

    //-------------------------------------------------------------------------------------------//
    const powerButton = document.getElementById('power_button');
    const resetButton = document.getElementById('reset_button');
    const pauseButton = document.getElementById('pause_button');

    const updateStats = (engine) =>
        updateStatus(engine.fps + " FPS (" + engine.performance.toFixed(2) +"x)");

    let intervalId = null;
    powerButton.addEventListener('click', () => {
        if (nes.pressPower()) {
            resetButton.disabled = false;
            pauseButton.disabled = false;
            updateStatus(nes.cartConnector.metadata.name + " started");
            intervalId = setInterval(() => updateStats(nes.engine), 1000);
        } else {
            resetButton.setAttribute("disabled", "disabled");
            pauseButton.setAttribute("disabled", "disabled");
            updateStatus(nes.cartConnector.metadata.name + " stopped");
            clearInterval(intervalId);
        }
        updateFrontLED();
    }, false);

    resetButton.addEventListener('click', () => nes.pressReset(), false);

    pauseButton.addEventListener('click', () => {
        if (nes.pause()) {
            pauseButton.innerText = "Resume";
            updateStatus(nes.cartConnector.metadata.name + " paused");
        } else {
            pauseButton.innerText = "Pause";
            updateStatus(nes.cartConnector.metadata.name + " resumed");
        }
        updateFrontLED();
    }, false);

    //-------------------------------------------------------------------------------------------//
    const joypad = new Devices.Keyboard(
        //    -A-     -W-       -S-        -D-       -Shift-    -Enter-  -K-    -L-
        {left: 65, up: 87, down: 83, right: 68, select: 16, start: 13, b: 75, a: 76}
    );
    nes.insertController(joypad);

    //-------------------------------------------------------------------------------------------//
    const screenOutput = document.getElementById('screen');
    nes.connectVideo(screenOutput);

    //-------------------------------------------------------------------------------------------//
    const audioOutput = document.getElementById('audio');
    nes.connectAudio(audioOutput);

    //-------------------------------------------------------------------------------------------//
    const fileInput = document.getElementById('file_select_button');
    fileInput.value = "";

    fileInput.addEventListener('change', (e) => {
        nes.insertCartridge(e.target.files[0]);
    }, false);
    fileInput.addEventListener('click', () => {
        if (nes.isPowered)
            nes.powerOff();
        nes.removeCartridge();
    }, false);

    //-------------------------------------------------------------------------------------------//

    powerButton.disabled = false;
    fileInput.disabled = false;
    updateStatus("Ready");
} catch(e) {
    updateStatus("Error: " + e.message);
    console.error(e);
}