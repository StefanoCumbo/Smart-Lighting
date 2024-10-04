const mongoose = require('mongoose');

const MotionSensorSchema = new mongoose.Schema({
    sensorId: String,
    timestamp: { type: Date, default: Date.now },
    motionDetected: Boolean,
});

module.exports = mongoose.model('MotionSensor', MotionSensorSchema);
