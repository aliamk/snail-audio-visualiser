window.addEventListener('load', function () {
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    const snail = document.getElementById('snail');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    class Bar {
        constructor(x, y, width, height, color, index) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.color = color;
            this.index = index;
        }
        update(micInput) {
            // this.height = micInput * 1000;
            const sound = micInput * 8000;
            if (sound > this.height) {
                this.height = sound; // match height of sound
            } else {
                this.height -= this.height * 0.03; // if sound is less than height, decrease the value of height
            }
        }
        draw(context) {
            context.strokeStyle = this.color;
            // context.fillRect(this.x, this.y, this.width, this.height);
            context.lineWidth = this.width;
            // Any properties placed between save and restore stops the changes impacting other parts of the animation
            context.save();
            // context.translate(canvas.width * 0.5, canvas.height * 0.5) // position at center of canvas instead of top-left (0, 0)
            context.rotate(this.index * 0.043); // rotate bars using index so each rotation is unique - THIS CHANGES SHAPE DRAMATICALLY
            context.beginPath(); // Need this to stop bars forming one big shape
            // context.moveTo(0, 0); // starting coordinate of the bar (replacing fillRect above)
            // context.lineTo(this.x, this.y + this.height); // ending coordinates of the bar
            context.bezierCurveTo(this.x * 0.5, this.y * 0.5, this.height * -0.5 - 150, this.height + 50, this.x, this.y)
            context.stroke(); // Draw the bar
            // Draw a circle if index if greater than 100
            if (this.index > 150) {
                context.beginPath();
                context.arc(this.x, this.y + 10 + this.height * 0.5, this.height * 0.1, this.height * 0.05, 0, Math.PI * 2);
                context.stroke();
                context.beginPath();
                context.moveTo(this.x, this.y + 10); // starting coordinate of the circle 
                context.lineTo(this.x, this.y + 10 + this.height * 0.5); // ending coordinates of the circle
                context.stroke();
            }
            context.restore();

        }
    }

    // fft Fast Fourier Transform - audio API slices raw audio data into specific audio samples
    class Microphone {
        constructor(fftSize) {
            this.initialized = false;  // takes the mic a second to get ready for
            navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
                this.audioContext = new AudioContext();
                this.microphone = this.audioContext.createMediaStreamSource(stream); // creates audio source node
                this.analyser = this.audioContext.createAnalyser(); // create analyser node - time + frequency data
                this.analyser.fftSize = fftSize; // Slice audio into specific number of audio samples
                const bufferLength = this.analyser.frequencyBinCount; // calculate how many audio samples we'll receive, frequencyBinCount is always half the size of fftSize
                this.dataArray = new Uint8Array(bufferLength); // Uint8Array is an array if unsigned integers (0 - 255) - we can use these to match the number of audio samples
                this.microphone.connect(this.analyser); //  Slice audio from mic into samples and extract the time + frequency data
                this.initialized = true;
            }).catch((err) => { // if there's no response from the promise then catch the error
                console.log(err)
            })
        }
        // Get the audio samples in array format
        getSamples() {
            this.analyser.getByteTimeDomainData(this.dataArray); // pass this time-domain data into the dataArray
            let normSamples = [...this.dataArray].map(e => e / 128 - 1); // convert the UintArray data into a range -1 to 1 (instead of 0 - 255)
            return normSamples;
        }
        // Calculate the average of all the audio sample numbers and return a single number
        getVolume() {
            this.analyser.getByteTimeDomainData(this.dataArray); // pass this time-domain data into the dataArray
            let normSamples = [...this.dataArray].map(e => e / 128 - 1); // convert the UintArray data into a range -1 to 1 (instead of 0 - 255)
            let sum = 0; // accumulate value of sum of all samples
            for (let i = 0; i < normSamples.length; i++) {  // Using RMS (root mean square) to calculate average of all the -1 to 1 values (result is a positive number)
                sum += normSamples[i] * normSamples[i];
            }
            let volume = Math.sqrt(sum / normSamples.length);
            return volume;
        }
    }

    let fftSize = 512;
    const microphone = new Microphone(fftSize); // fftSize 512... can use a diff value if you like
    let bars = [];
    // The number of audio samples is always half of the fftSize value
    let barWidth = canvas.width / (fftSize / 2);

    const createBars = () => {
        for (let i = 1; i < (fftSize / 2); i++) {
            // bars.push(new Bar(barWidth * i, 300, 0.5, 50, 'red', i)); // create 256 bars with 256 samples
            let color = 'hsl(' + i * 2 + ',100%, 50%)'
            bars.push(new Bar(0, i * 0.9, 1, 50, color, i)); // create 256 bars with 256 samples

        }
    }
    createBars();
    console.log('rr: ', bars);

    let softVolume = 0;

    const animate = () => {
        if (microphone.initialized === true) {
            ctx.clearRect(0, 0, canvas.width, canvas.height); // remove previous paint so canvas is blank
            const samples = microphone.getSamples();
            const volume = microphone.getVolume();
            ctx.save();
            ctx.translate(canvas.width * 0.5 - 70, canvas.height * 0.5 + 50)
            bars.forEach((bar, i) => {
                bar.update(samples[i])
                bar.draw(ctx)
            });
            ctx.restore();
            softVolume = softVolume * 0.9 + volume * 0.1;
            snail.style.transform = 'translate(-50%, -50%) scale(' + (1 + softVolume * 5), (1 + softVolume * 5) + ')';
        }
        requestAnimationFrame(animate)
    }
    animate();

    this.window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    })
})

