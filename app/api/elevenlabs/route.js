import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request) {
    try {
        if (!process.env.XI_API_KEY) {
            return NextResponse.json(
                { error: 'Configuration serveur incorrecte: Clé API manquante' },
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

        // Paramètres pour une dictée plus claire et plus lente
        const voiceId = "7fbQ7yJuEo56rYjrYaEh";
        const stability = 0.35; // Légèrement expressif, mais naturel
        const similarityBoost = 0.6; // Garde une bonne fidélité à la voix originale
        const speed = 0.8; // Un peu ralenti pour une meilleure compréhension
        const useSpeakerBoost = false; // Pas nécessaire ici

        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'xi-api-key': process.env.XI_API_KEY,
            },
            body: JSON.stringify({
                text,
                model_id: "eleven_multilingual_v2",
                voice_settings: {
                    stability,
                    similarity_boost: similarityBoost,
                    style,
                    use_speaker_boost: useSpeakerBoost,
                    speed
                },
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return NextResponse.json(
                {
                    error: 'Erreur lors de la génération de l\'audio',
                    details: errorData.detail || response.statusText
                },
                { status: response.status }
            );
        }

        const audioBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(audioBuffer);

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Length': buffer.length.toString(),
            },
        });
    } catch (error) {
        console.error('Erreur génération audio:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la génération de l\'audio' },
            { status: 500 }
        );
    }
}
