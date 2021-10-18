export class NESFile {
    constructor(opts) {
        if (opts) {
            if (opts['onload'])   this.onload = opts['onload'];
            if (opts['onunload']) this.onunload = opts['onunload'];
            if (opts['onstatus']) this.onstatus = opts['onstatus'];
        }
        
        this.name = "";
        this.size = 0;
        this.data = null;
        
        this.updateStatus("No file loaded");
    }
    
    load(file) {
        return new Promise(
            (resolve, reject) => {
                this.reset();
                this.name = file.name;
                this.size = file.size;
                
                if (this.size) {
                    const reader = new FileReader;
                    reader.onabort = () => reject(new DOMException);
                    reader.onerror = () => reject(reader.error);
                    reader.onload = () => resolve(reader.result);
                
                    reader.readAsArrayBuffer(file);
                } else {
                    reject(new Error("File is empty"));
                }
            }
        ).then(
            (value) => {
                this.data = value;
                
                this.isLoaded = true;
                this.isValid = true;
                
                this.updateStatus(this.name + " loaded");
            }
        ).then(
            this.onload && this.onload.bind(null, {target: this})
        ).catch(
            (error) => {
                this.isLoaded = true;
                this.isValid = false;
                
                this.updateStatus(this.name + " loaded");
                
                if (error.message)
                    this.updateStatus(error.message);
            }
        );
    }
    unload() {
        if (this.isLoaded) {
            return Promise.resolve().then(
                this.onunload && this.onunload.bind(null, {target: this})
            ).then(() => {
                this.isLoaded = false;
                this.isValid = null;
                
                this.updateStatus(this.name + " unloaded");
                this.reset();
            });
        }
        
    }
    reset() {
        this.name = "";
        this.size = 0;
        this.data = null;
    }
    
    updateStatus(text) {
        this.status = text || "";
        if (this.onstatus) this.onstatus({target: this});
        return this.status;
    }
}
export default NESFile;
