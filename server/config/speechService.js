/* server/config/speechService.js */
const sdk = require('microsoft-cognitiveservices-speech-sdk');
const { PassThrough } = require('stream');

const subscriptionKey = process.env.AZURE_SPEECH_KEY;
const serviceRegion = process.env.AZURE_SPEECH_REGION;

if (!subscriptionKey || !serviceRegion) {
    throw new Error('Azure Speech Key or Region is not set in the environment variables.');
}

const setupSpeechRecognition = (ws) => {
    const pushStream = sdk.AudioInputStream.createPushStream(sdk.AudioStreamFormat.getWaveFormat(16000, 16, 1));

    const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);
    const speechConfig = sdk.SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);
    speechConfig.speechRecognitionLanguage = "en-US";
    speechConfig.enableDictation = true;

    const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

    recognizer.recognizing = (s, e) => {
        if (e.result.text) {
            console.log(`RECOGNIZING: Text=${e.result.text}`);
        }
    };

    recognizer.recognized = (s, e) => {
        if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
            const transcript = e.result.text;
            console.log(`RECOGNIZED: Text=${transcript}`);
            if (transcript) {
                 ws.send(JSON.stringify({ type: 'transcript', data: transcript }));
            }
        } else if (e.result.reason === sdk.ResultReason.NoMatch) {
            console.log("NOMATCH: Speech could not be recognized.");
        }
    };

    recognizer.canceled = (s, e) => {
        console.error(`CANCELED: Reason=${e.reason}`);
        if (e.reason === sdk.CancellationReason.Error) {
            console.error(`CANCELED: ErrorCode=${e.errorCode}`);
            console.error(`CANCELED: ErrorDetails=${e.errorDetails}`);
            console.error("Did you set the speech resource key and region values?");
        }
        recognizer.stopContinuousRecognitionAsync();
    };

    recognizer.sessionStarted = (s, e) => {
        console.log("\nSession started event.");
    };

    recognizer.sessionStopped = (s, e) => {
        console.log("\nSession stopped event.");
        recognizer.stopContinuousRecognitionAsync();
    };
    
    recognizer.startContinuousRecognitionAsync(
        () => console.log('Speech recognition started.'),
        (err) => console.error(`Error starting recognition: ${err}`)
    );

    ws.on('message', (message) => {
        if (typeof message === 'object') {
            pushStream.write(message);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected, closing speech recognition stream.');
        recognizer.close();
    });
};

module.exports = { setupSpeechRecognition };
