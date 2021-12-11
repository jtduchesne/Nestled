(function() {
    const screenOutput = document.getElementById('screen');

    const joypad = new Nestled.Keyboard(
      //    -A-     -W-       -S-        -D-       -Shift-    -Enter-  -K-    -L-
        {left: 65, up: 87, down: 83, right: 68, select: 16, start: 13, b: 75, a: 76}
    );

    const nes = new Nestled.NES({screen: screenOutput, controller: joypad});

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
            updateStatus(nes.cartridge.name + " started");
            interval = setInterval(showStats, 1000);
        } else {
            resetButton.setAttribute("disabled", "disabled");
            pauseButton.setAttribute("disabled", "disabled");
            updateStatus(nes.cartridge.name + " stopped");
            clearInterval(interval);
        }
        updateFrontLED();
    }, false);

    resetButton.addEventListener('click', () => nes.pressReset(), false);

    pauseButton.addEventListener('click', () => {
        if (nes.pause()) {
            pauseButton.innerText = "Resume";
            updateStatus(nes.cartridge.name + " paused");
        } else {
            pauseButton.innerText = "Pause";
            updateStatus(nes.cartridge.name + " resumed");
        }
        updateFrontLED();
    }, false);

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

    const nesFile = new Nestled.NESFile({
        onload:   () => nes.insertCartridge(nesFile),
        onunload: () => nes.removeCartridge(),
    });

    fileInput.addEventListener('change', (e) => {
        nesFile.load(e.target.files[0]);
    }, false);
    fileInput.addEventListener('click', () => {
        if (nes.isPowered)
            nes.powerOff();
        nesFile.unload();
    }, false);
})();
