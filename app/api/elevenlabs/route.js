import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const XI_API_KEY = process.env.XI_API_KEY;

        if (!XI_API_KEY) {
            return NextResponse.json(
                { error: 'Configuration serveur incorrecte: Clé API ElevenLabs manquante' },
                { status: 500 }
            );
        }

        const body = await request.json();
        const { text } = body;

        if (!text) {
            return NextResponse.json(
                { error: 'Le texte est requis' },
                { status: 400 }
            );
        }

        // D'abord, récupérer la liste des voix disponibles
        let voice_id = body.voice_id;
        const model_id = "eleven_multilingual_v2"; // Modèle multilingue

        // Si aucune voix n'est spécifiée ou la voix spécifiée n'est pas disponible,
        // récupérons la première voix disponible
        if (!voice_id) {
            const voicesResponse = await fetch('https://api.elevenlabs.io/v1/voices', {
                headers: {
                    'Accept': 'application/json',
                    'xi-api-key': XI_API_KEY
                }
            });

            if (voicesResponse.ok) {
                const voicesData = await voicesResponse.json();
                if (voicesData.voices && voicesData.voices.length > 0) {
                    voice_id = voicesData.voices[0].voice_id;
                }
            }

            // Si nous n'avons toujours pas de voix, utilisons la voix par défaut d'ElevenLabs (Adam)
            if (!voice_id) {
                voice_id = "pNInz6obpgDQGcFmaJgB"; // Adam - une voix prédéfinie d'ElevenLabs
            }
        }

        const url = `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': XI_API_KEY
            },
            body: JSON.stringify({
                text: text,
                model_id: model_id,
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75,
                    style: 0.5,
                    use_speaker_boost: true
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`ElevenLabs API error: ${response.status} ${errorText}`);
        }

        const audioBuffer = await response.arrayBuffer();

        return new NextResponse(audioBuffer, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Length': audioBuffer.byteLength.toString(),
            },
        });
    } catch (error) {
        console.error('Erreur génération audio ElevenLabs:', error);
        return NextResponse.json(
            { error: `Erreur lors de la génération de l'audio: ${error.message}` },
            { status: 500 }
        );
    }
}