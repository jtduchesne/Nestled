(function() {
    const screenOutput = document.getElementById('screen');

    const nes = new Nestled.NES({screen: screenOutput});

    const frontLED = document.getElementById('front_led');

    function updateFrontLED() {
        frontLED.classList.remove("on", "off", "paused");
        frontLED.classList.add(nes.frontLEDState);
    }

    const powerButton = document.getElementById('power_button');
    const resetButton = document.getElementById('reset_button');
    const pauseButton = document.getElementById('pause_button');

    let interval;
    powerButton.addEventListener('click', () => {
        if (nes.pressPower()) {
            resetButton.disabled = false;
            pauseButton.disabled = false;
            updateStatus(nes.cartConnector.name + " started");
            interval = setInterval(showStats, 1000);
        } else {
            resetButton.setAttribute("disabled", "disabled");
            pauseButton.setAttribute("disabled", "disabled");
            updateStatus(nes.cartConnector.name + " stopped");
            clearInterval(interval);
        }
        updateFrontLED();
    }, false);

    resetButton.addEventListener('click', () => nes.pressReset(), false);

    pauseButton.addEventListener('click', () => {
        if (nes.pause()) {
            pauseButton.innerText = "Resume";
            updateStatus(nes.cartConnector.name + " paused");
        } else {
            pauseButton.innerText = "Pause";
            updateStatus(nes.cartConnector.name + " resumed");
        }
        updateFrontLED();
    }, false);

  //-------------------------------------------------------------------------------------------//

    const joypad = new Nestled.Keyboard(
        //    -A-     -W-       -S-        -D-       -Shift-    -Enter-  -K-    -L-
        {left: 65, up: 87, down: 83, right: 68, select: 16, start: 13, b: 75, a: 76}
    );
    nes.insertController(joypad);

  //-------------------------------------------------------------------------------------------//

    const statusOutput = document.getElementById('status');

    function updateStatus(text) {
        statusOutput.innerText = text;
        console.log("Nestled: " + text);
    }

    function showStats() {
        statusOutput.innerText = nes.mainLoop.fps + " FPS (" + nes.mainLoop.performance.toFixed(2) +"x)";
    }

  //-------------------------------------------------------------------------------------------//

    const fileInput = document.getElementById('file_select_button');

    function resetFileInput() { fileInput.value = ""; }
    resetFileInput();

    fileInput.addEventListener('change', (e) => {
        nes.insertCartridge(e.target.files[0]);
    }, false);
    fileInput.addEventListener('click', () => {
        if (nes.isPowered)
            nes.powerOff();
        nes.removeCartridge();
    }, false);
})();
