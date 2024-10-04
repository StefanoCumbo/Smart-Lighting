const express = require('express');
const mqtt = require('mqtt');
const mongoose = require('mongoose');
const connectDB = require('./db');
const MotionSensor = require('./models/motionSensor');
const path = require('path');

const app = express();
const port = 3000;

// Connect to MongoDB
connectDB();

// MQTT setup
const mqttClient = mqtt.connect('mqtt://broker.hivemq.com:1883');
const motionTopic = 'home/lighting/motion';
const lightControlTopic = 'lights/control'; // MQTT topic for light control

mqttClient.on('connect', () => {
    console.log('Connected to MQTT broker');
    mqttClient.subscribe(lightControlTopic, (err) => {
        if (!err) {
            console.log(`Subscribed to topic: ${lightControlTopic}`);
        }
    });
});

let motionDetected = false;
let lightStatus = 'OFF';

mqttClient.on('message', (topic, message) => {
    if (topic === lightControlTopic) {
        lightStatus = message.toString();
        console.log(`Light control command received: ${lightStatus}`);
    } else if (topic === motionTopic) {
        const data = JSON.parse(message.toString());
        motionDetected = data.motionDetected;
        console.log(`Motion detected updated: ${motionDetected}`);
    }
});

// Serve static HTML page on the default route
app.use(express.static(path.join(__dirname, 'public')));



// Simulate motion detection based on random numbers
const threshold = 0.7; // Set your threshold value here
setInterval(() => {
    const randomNumber = Math.random();
    if (randomNumber > threshold) {
        motionDetected = true;
        mqttClient.publish(motionTopic, JSON.stringify({ motionDetected: true }));
        mqttClient.publish(lightControlTopic, 'ON'); // Turn on the lights
        console.log(`Random number ${randomNumber} exceeds threshold ${threshold}. Motion detected, lights ON!`);
    } else {
        motionDetected = false;
        mqttClient.publish(motionTopic, JSON.stringify({ motionDetected: false }));
        mqttClient.publish(lightControlTopic, 'OFF'); // Turn off the lights
        console.log(`Random number ${randomNumber} does not exceed threshold ${threshold}. No motion detected, lights OFF.`);
    }
}, 5000); // Generate random number every 5 seconds (adjustable)


// Log motion sensor data to MongoDB at regular intervals
setInterval(async () => {
    const motionSensorData = {
        sensorId: 'sensor-1',
        motionDetected: motionDetected, // Use actual motion detection value
    };

    // Log motion detection to MongoDB
    const newMotionReading = new MotionSensor(motionSensorData);
    await newMotionReading.save();

    console.log('Motion sensor data logged');
}, 5000); // Log data every 5 seconds (adjustable)

// Start the server
app.listen(port, () => {
    console.log(`Smart home lighting system running at http://localhost:${port}`);
});
