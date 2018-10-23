const Gpio = require('pigpio').Gpio;
const db = require('./firebase')
const motor = new Gpio(10, {mode: Gpio.OUTPUT});

// The number of microseconds it takes sound to travel 1cm at 20 degrees celcius
const MICROSECDONDS_PER_CM = 1e6/34321;
const trigger = new Gpio(23, {mode: Gpio.OUTPUT});
const echo = new Gpio(24, {mode: Gpio.INPUT, alert: true});

trigger.digitalWrite(0); // Make sure trigger is low

let start = true; 

db.collection('licenses').onSnapshot(function(doc) {
	doc.forEach(docdoc => {
		console.log(docdoc.data())
	})
	
	if (start) {
		console.log('masuk start true')
		start = false;
	} else {
		console.log('masuk buka plang')
		start = false;
		motor.servoWrite(2000)
	}
})

const watchHCSR04 = () => {
	console.log('masuk pak eko sensor')
  let startTick;

  echo.on('alert', (level, tick) => {
    if (level == 1) {
      startTick = tick;
    } else {
      const endTick = tick;
      const diff = (endTick >> 0) - (startTick >> 0); // Unsigned 32 bit arithmetic
      console.log(diff / 2 / MICROSECDONDS_PER_CM);
      let distance = diff / 2 / MICROSECDONDS_PER_CM
		if (distance >= 10) {
			/*db
				.collection('temp')
				.doc('license')
				.update({
						isVehicleExist: false
				})
				.then(() => {
					console.log('vehicle not detected');
				})
				.catch(err => {
					console.log(err);
				});*/
				
			console.log('tutup palang')
			setTimeout(() => {
				motor.servoWrite(1200)
			}, 2500)
		  
		} else {
			/*db
				.collection('temp')
				.doc('license')
				.update({
						isVehicleExist: true
				})
				.then(() => {
					console.log('vehicle detected');
				})
				.catch(err => {
					console.log(err);
				});*/
		}
	}
  });
};

watchHCSR04();

// Trigger a distance measurement once per second

setInterval(() => {
  trigger.trigger(10, 1); // Set trigger high for 10 microseconds
}, 1000);