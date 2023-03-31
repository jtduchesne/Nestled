(function() {
    const nes = new Nestled.NES();

  //-------------------------------------------------------------------------------------------//

    const statusOutput = document.getElementById('status');

    const updateStatus = (text) => {
        statusOutput.innerText = text;
        // console.log("Nestled: " + text);
    };

  //-------------------------------------------------------------------------------------------//

    const frontLED = document.getElementById('front_led');

    const updateFrontLED = () => {
        frontLED.classList.remove("on", "off", "paused");
        frontLED.classList.add(nes.frontLED);
    };

  //-------------------------------------------------------------------------------------------//

    const powerButton = document.getElementById('power_button');
    const resetButton = document.getElementById('reset_button');
    const pauseButton = document.getElementById('pause_button');

    const updateStats = ({ fps, performance }) =>
        updateStatus(`${fps} FPS (${performance.toFixed(2)}x)`);

    let intervalId = null;
    powerButton.addEventListener('click', () => {
        if (nes.buttons.pressPower()) {
            resetButton.disabled = false;
            pauseButton.disabled = false;
            updateStatus(`${nes.game.name} started`);
            intervalId = setInterval(() => updateStats(nes.engine), 1000);
        } else {
            resetButton.setAttribute("disabled", "disabled");
            pauseButton.setAttribute("disabled", "disabled");
            clearInterval(intervalId);
        }
        updateFrontLED();
    }, false);

    resetButton.addEventListener('click', () => {
        nes.buttons.pressReset();
    }, false);

    pauseButton.addEventListener('click', () => {
        if (nes.engine.pause()) {
            pauseButton.innerText = "Resume";
            updateStatus(`${nes.game.name} paused`);
        } else {
            pauseButton.innerText = "Pause";
            updateStatus(`${nes.game.name} resumed`);
        }
        updateFrontLED();
    }, false);

  //-------------------------------------------------------------------------------------------//

    const joypad1 = new Nestled.Devices.Keyboard({
        left: "A", up: "W", down: "S", right: "D",
        select: "Shift", start: "Enter", b: "K", a: "L"
    });
    nes.controllers.insert(joypad1, 1);

    const joypad2 = new Nestled.Devices.Keyboard({
        left: "A", up: "W", down: "S", right: "D",
        select: "Shift", start: "Enter", b: "K", a: "L"
    });
    nes.controllers.insert(joypad2, 2);

  //-------------------------------------------------------------------------------------------//

    const screenOutput = document.getElementById('screen');
    nes.video.connect(screenOutput);

  //-------------------------------------------------------------------------------------------//

    const volumeInput = document.getElementById('volume');
    volumeInput.addEventListener('change', (e) => {
        const value = e.target.value / e.target.max;
        nes.audio.volume = value;
        e.target.title = `Volume: ${Math.round(value * 100)}%`;
    });
    nes.audio.volume = volumeInput.value / volumeInput.max;

  //-------------------------------------------------------------------------------------------//

    const fileInput = document.getElementById('file_select_button');
    fileInput.value = "";

    fileInput.addEventListener('change', (e) => {
        nes.game.load(e.target.files[0]);
    }, false);
    fileInput.addEventListener('click', () => {
        nes.game.unload();
    }, false);

  //-------------------------------------------------------------------------------------------//

    powerButton.disabled = false;
    fileInput.disabled = false;
    updateStatus("Ready");
})();
