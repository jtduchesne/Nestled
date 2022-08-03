export class AudioOutput {
    constructor() {
        this.context  = null;
        this.gainNode = null;
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
            
            this.gainNode = this.context.createGain();
            this.gainNode.gain.value = this.value / this.max;
            this.gainNode.connect(this.context.destination);
        }
        this.next = 0.0;
    }
    stop() {
        this.gainNode = null;
        
        if (this.context)
            this.context.close();
        this.context = null;
    }
    
    //===============================================================//
    
    schedule(buffer) {
        if (this.context) {
            let source = this.context.createBufferSource();
            source.buffer = buffer;
            source.connect(this.gainNode);
            
            let bufferDuration = source.buffer.duration;
            if (this.next < this.context.currentTime) {
                this.next = this.context.currentTime + bufferDuration;
                source.start();
            } else {
                this.next += bufferDuration;
                source.start(this.next, 0, bufferDuration);
            }
        }
    }
}

export default AudioOutput;
