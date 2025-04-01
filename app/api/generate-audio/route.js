import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialiser le client OpenAI avec la clé API
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
    try {
        // Vérifier si la clé API est disponible
        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { error: 'Configuration serveur incorrecte: Clé API manquante' },
                { status: 500 }
            );
        }

        // Récupérer les données de la requête
        const body = await request.json();
        const { text, voice, model, speed } = body;

        // Vérifier si le texte est fourni
        if (!text) {
            return NextResponse.json(
                { error: 'Le texte est requis' },
                { status: 400 }
            );
        }

        // Optimiser le texte pour une meilleure prononciation des voyelles
        // et minimiser les silences à la fin
        const enhancedText = text
                // Ajouter un espace après chaque voyelle courte pour forcer la prononciation
                .replace(/([ًٌٍَُِْ])/g, '$1 ')
                // Accentuer la prononciation du chadda en ajoutant un espace après
                .replace(/(ّ)/g, '$1 ')
                // Séparer légèrement les mots pour une meilleure articulation
                .replace(/\s+/g, ' . ')
                // Ajouter un point à la fin si nécessaire (aide à garder l'intonation jusqu'à la fin)
                .replace(/([^.!?])$/, '$1.')
            // Ajouter une petite phrase après pour que le modèle ne laisse pas un long silence
            + ' ';

        // Paramètres pour l'API
        const params = {
            model: model || 'tts-1-hd',  // Modèle TTS d'OpenAI (options: 'tts-1' ou 'tts-1-hd')
            voice: voice || 'onyx',
            input: enhancedText,
            speed: speed || 0.8, // Encore plus ralenti pour une meilleure articulation
            response_format: 'mp3',
        };

        // Ajout d'une dernière syllabe brève pour éviter le silence à la fin
        // En arabe, on doit couper la phrase un peu plus abruptement à la fin pour éviter les pauses
        params.input = params.input.replace(/([.!?])$/, ' $1');

        // Appeler l'API OpenAI pour générer l'audio
        const mp3Response = await openai.audio.speech.create(params);

        // Convertir la réponse en buffer
        const buffer = Buffer.from(await mp3Response.arrayBuffer());

        // Retourner l'audio en tant que réponse
        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Length': buffer.length.toString(),
            },
        });
    } catch (error) {
        // Différencier les types d'erreurs pour une meilleure réponse
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
        } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            return NextResponse.json(
                { error: 'Impossible de se connecter au service OpenAI' },
                { status: 503 }
            );
        }

        return NextResponse.json(
            {
                error: 'Erreur lors de la génération de l\'audio',
                details: error.message,
                type: error.name
            },
            { status: 500 }
        );
    }
}