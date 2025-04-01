import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
    try {
        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { error: 'Configuration serveur incorrecte: Clé API manquante' },
                { status: 500 }
            );
        }

        const body = await request.json();
        const { text, voice, model, speed } = body;

        if (!text) {
            return NextResponse.json(
                { error: 'Le texte est requis' },
                { status: 400 }
            );
        }

        // Optimiser le texte pour une meilleure prononciation des voyelles
        const enhancedText = text
            // Ajouter un espace après chaque voyelle courte pour forcer la prononciation
            .replace(/([ًٌٍَُِْ])/g, '$1 ')
            // Ajouter un point à la fin si nécessaire (aide à garder l'intonation jusqu'à la fin)
            .replace(/([^.!?])$/, '$1.');

        const mp3Response = await openai.audio.speech.create({
            model: model || 'tts-1-hd',
            voice: voice || 'onyx',
            input: enhancedText,
            speed: speed || 0.8,
            response_format: 'mp3',
        });

        const buffer = Buffer.from(await mp3Response.arrayBuffer());

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Length': buffer.length.toString(),
            },
        });
    } catch (error) {
        if (error.name === 'AuthenticationError') {
            return NextResponse.json(
                { error: 'Erreur d\'authentification avec l\'API OpenAI' },
                { status: 401 }
            );
        } else if (error.name === 'RateLimitError') {
            return NextResponse.json(
                { error: 'Limite de taux de l\'API OpenAI dépassée' },
                { status: 429 }
            );
        }

        console.error('Erreur génération audio:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la génération de l\'audio' },
            { status: 500 }
        );
    }
}