
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { getClient, MODELS } from "./config";

export interface LiveConnectionState {
    isPlaying: boolean;
    isListening: boolean;
}

export class LiveService {
    private client: GoogleGenAI;
    private inputAudioContext: AudioContext | null = null;
    private outputAudioContext: AudioContext | null = null;
    private inputNode: ScriptProcessorNode | null = null;
    private outputNode: GainNode | null = null;
    private stream: MediaStream | null = null;
    private nextStartTime = 0;
    private sources = new Set<AudioBufferSourceNode>();
    private session: any = null;

    constructor() {
        this.client = getClient(false); 
    }

    async connect(config: { voiceName: string, systemInstruction?: string }, onVolume: (v: number) => void): Promise<void> {
        this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        
        this.outputNode = this.outputAudioContext.createGain();
        this.outputNode.connect(this.outputAudioContext.destination);

        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (e) {
            throw new Error("Microphone access denied. Please check your permissions.");
        }

        const sessionPromise = this.client.live.connect({
            model: MODELS.LIVE,
            callbacks: {
                onopen: () => {
                    console.log("[LiveService] Connection Opened");
                    this.startAudioInput(sessionPromise, onVolume);
                },
                onmessage: async (message: LiveServerMessage) => {
                    await this.handleMessage(message);
                },
                onerror: (e: any) => {
                    console.error("[LiveService] Error", e);
                },
                onclose: (e: any) => {
                    console.log("[LiveService] Closed", e);
                }
            },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: config.voiceName } }
                },
                systemInstruction: config.systemInstruction || "You are a creative director's assistant."
            }
        });

        this.session = await sessionPromise;
    }

    private startAudioInput(sessionPromise: Promise<any>, onVolume: (v: number) => void) {
        if (!this.inputAudioContext || !this.stream) return;

        const source = this.inputAudioContext.createMediaStreamSource(this.stream);
        this.inputNode = this.inputAudioContext.createScriptProcessor(4096, 1, 1);
        
        const analyzer = this.inputAudioContext.createAnalyser();
        analyzer.fftSize = 256;
        source.connect(analyzer);

        const dataArray = new Uint8Array(analyzer.frequencyBinCount);
        
        const updateVolume = () => {
            if (!this.stream?.active) return;
            analyzer.getByteFrequencyData(dataArray);
            let sum = 0;
            for(let i=0; i<dataArray.length; i++) sum += dataArray[i];
            const avg = sum / dataArray.length;
            onVolume(avg);
            requestAnimationFrame(updateVolume);
        };
        updateVolume();

        this.inputNode.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const pcmBlob = this.createPcmBlob(inputData);
            
            sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
            });
        };

        source.connect(this.inputNode);
        this.inputNode.connect(this.inputAudioContext.destination);
    }

    private async handleMessage(message: LiveServerMessage) {
        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
        if (base64Audio && this.outputAudioContext && this.outputNode) {
            try {
                this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);
                
                const audioBuffer = await this.decodeAudioData(
                    this.base64ToBytes(base64Audio),
                    this.outputAudioContext,
                    24000,
                    1
                );

                const source = this.outputAudioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(this.outputNode);
                
                source.addEventListener('ended', () => {
                    this.sources.delete(source);
                });

                source.start(this.nextStartTime);
                this.nextStartTime += audioBuffer.duration;
                this.sources.add(source);
                
            } catch (e) {
                console.error("Audio decoding error", e);
            }
        }

        if (message.serverContent?.interrupted) {
            this.sources.forEach(source => {
                source.stop();
                this.sources.delete(source);
            });
            this.nextStartTime = 0;
        }
    }

    async disconnect() {
        if (this.inputNode) {
            this.inputNode.disconnect();
            this.inputNode = null;
        }
        if (this.stream) {
            this.stream.getTracks().forEach(t => t.stop());
            this.stream = null;
        }
        if (this.inputAudioContext) {
            await this.inputAudioContext.close();
            this.inputAudioContext = null;
        }
        if (this.outputAudioContext) {
            await this.outputAudioContext.close();
            this.outputAudioContext = null;
        }
        this.sources.forEach(s => s.stop());
        this.sources.clear();
        this.nextStartTime = 0;
    }

    private createPcmBlob(data: Float32Array): { data: string, mimeType: string } {
        const l = data.length;
        const int16 = new Int16Array(l);
        for (let i = 0; i < l; i++) {
            let s = Math.max(-1, Math.min(1, data[i]));
            int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        
        let binary = '';
        const bytes = new Uint8Array(int16.buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        
        return {
            data: btoa(binary),
            mimeType: 'audio/pcm;rate=16000'
        };
    }

    private base64ToBytes(base64: string): Uint8Array {
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    }

    private async decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
        const dataInt16 = new Int16Array(data.buffer);
        const frameCount = dataInt16.length / numChannels;
        const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

        for (let channel = 0; channel < numChannels; channel++) {
            const channelData = buffer.getChannelData(channel);
            for (let i = 0; i < frameCount; i++) {
                channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
            }
        }
        return buffer;
    }
}
