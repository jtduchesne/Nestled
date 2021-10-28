(function() {
    const screenOutput = document.getElementById('screen');

    const joypad = new Nestled.Keyboard(
      //    -A-     -W-       -S-        -D-       -Shift-    -Enter-  -K-    -L-
        {left: 65, up: 87, down: 83, right: 68, select: 16, start: 13, b: 75, a: 76}
    );

    const nes = new Nestled.NES({screen: screenOutput, controller: joypad});

    const frontLED    = document.getElementById('front_led');
    const powerButton = document.getElementById('power_button');
    const resetButton = document.getElementById('reset_button');
    const pauseButton = document.getElementById('pause_button');

    powerButton.addEventListener('click', () => nes.pressPower(), false);
    resetButton.addEventListener('click', () => nes.pressReset(), false);
    pauseButton.addEventListener('click', () => {
        pauseButton.setAttribute("disabled", "disabled");
        nes.pause();
    }, false);

    nes.onpower = (e) => {
        frontLED.classList.remove("on", "off", "paused");
        frontLED.classList.add(e.target.frontLEDState);
        if (e.target.isPowered) {
            resetButton.disabled = false;
            pauseButton.disabled = false;
            updateStatus(e.target.cartridge.name + " started");
        } else {
            resetButton.setAttribute("disabled", "disabled");
            pauseButton.setAttribute("disabled", "disabled");
            updateStatus(e.target.cartridge.name + " stopped");
        }
    };
    nes.onpause = (e) => {
        frontLED.classList.remove("on", "off", "paused");
        frontLED.classList.add(e.target.frontLEDState);
        pauseButton.disabled = false;
        if (e.target.isPaused)
            updateStatus(e.target.cartridge.name + " paused");
        else
            updateStatus(e.target.cartridge.name + " resumed");
    };

  //-------------------------------------------------------------------------------------------//

    const statusOutput = document.getElementById('status');

    function updateStatus(text) {
        statusOutput.innerText = text;
        console.log("Nestled: " + text);
    }

    function showStats(e) {
        statusOutput.innerText = e.target.fps + " FPS (" + e.target.performance.toFixed(2) +"x)";
    }
    nes.ontime = showStats;
    nes.onfps = showStats;

  //-------------------------------------------------------------------------------------------//

    const fileInput = document.getElementById('file_select_button');

    function resetFileInput() { fileInput.value = ""; }
    resetFileInput();

    const nesFile = new Nestled.NESFile({
        onstatus: (e) => updateStatus(e.target.status),
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
