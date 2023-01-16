export class AudioOutput {
    constructor() {
        this.context  = null;
        this.gainNode = null;

        this.sampleRate = 44100;
        this.bufferLength = this.sampleRate / 30;
        this.createNewBuffer();
    }
    
    get connected()    { return !!this.element; }
    get disconnected() { return  !this.element; }
    
    connect(element) {
        if (element && element.nodeName === 'INPUT') {
            this.element = element;
            this.value   = Number(element.value);
            this.max     = Number(element.max) || 100;
            
            this.handleVolumeChange = (e) => {
                this.value = e.target.value;
                if (this.gainNode)
                    this.gainNode.gain.value = this.value / this.max;
            };
            this.element.addEventListener('change', this.handleVolumeChange);
            
            return element;
        } else {
            return this.disconnect();
        }
    }
    disconnect() {
        if (this.element)
            this.element.removeEventListener('change', this.handleVolumeChange);
        this.element = null;
        this.handleVolumeChange = undefined;
        this.value = 0;
        this.max = 100;
        
        return null;
    }
    
    //===============================================================//
    
    start() {
        if (this.connected && typeof AudioContext === 'function') {
            this.context = new AudioContext();
            
            this.sampleRate = this.context.sampleRate;
            this.bufferLength = this.sampleRate / 30;
            this.createNewBuffer();
            
            this.gainNode = this.context.createGain();
            this.gainNode.gain.value = this.value / this.max;
            this.gainNode.connect(this.context.destination);
        }
        this.next = 0.0;
    }
    stop() {
        if (this.gainNode)
            this.gainNode.disconnect();
        this.gainNode = null;
        
        if (this.context)
            this.context.close();
        this.context = null;
    }
    
    //===============================================================//
    
    writeSample(value) {
        this.data[this.index++] = value;
        if (this.index === this.bufferLength) {
            this.schedule(this.buffer);
            this.createNewBuffer();
        }
    }
    createNewBuffer() {
        if (this.context) {
            this.buffer = this.context.createBuffer(1, this.bufferLength, this.sampleRate);
            this.data   = this.buffer.getChannelData(0);
        } else {
            this.buffer = null;
            this.data   = new Uint8Array(this.bufferLength);
        }
        this.index = 0;
    }
    
    schedule(buffer) {
        if (this.context) {
            const source = this.context.createBufferSource();
            source.buffer = buffer;
            source.connect(this.gainNode);
            
            if (this.next < this.context.currentTime) {
                source.start();
                this.next = this.context.currentTime + buffer.duration;
            } else {
                source.start(this.next);
                this.next += buffer.duration;
            }
        }
    }
}

export default AudioOutput;
